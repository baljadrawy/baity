/**
 * POST /api/v1/auth/child-login
 * تسجيل دخول الطفل عبر PIN
 *
 * Body: { memberId, pin }
 * Response: { member } + Set-Cookie (httpOnly، صالح 24 ساعة)
 *
 * الأمان:
 * - 5 محاولات فاشلة → قفل 15 دقيقة
 * - PIN محفوظ بـ bcrypt (rounds=12)
 * - Token صالح 24 ساعة فقط
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/core/db/prisma';
import { handleApiError } from '@/core/db/with-household';
import { generateChildToken } from '@/core/auth/jwt';
import { isLocked, isValidPin, recordFailedAttempt, resetAttempts, sanitizePin, verifyPin } from '@/core/auth/pin';
import { buildSessionCookies } from '@/core/auth/authenticate';

const childLoginSchema = z.object({
  memberId: z.string().min(1),
  pin: z.string().transform(sanitizePin).pipe(z.string().refine(isValidPin, 'PIN يجب أن يكون 4 أرقام')),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, pin } = childLoginSchema.parse(body);

    // فحص القفل
    const lockStatus = isLocked(memberId);
    if (lockStatus.locked) {
      return NextResponse.json(
        {
          error: 'account_locked',
          minutesLeft: lockStatus.minutesLeft,
        },
        { status: 429 }
      );
    }

    // جلب بيانات الطفل
    const member = await prisma.householdMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member || member.role !== 'CHILD') {
      return NextResponse.json({ error: 'member not found' }, { status: 404 });
    }

    // PIN مخزَّن مُشفَّراً (bcrypt rounds=12) على HouseholdMember.pinHash
    // يُعيِّنه ولي الأمر عبر POST /api/v1/members/[id]/pin
    const storedHash = member.pinHash;
    if (!storedHash) {
      return NextResponse.json({ error: 'pin_not_set' }, { status: 400 });
    }
    const isValid = await verifyPin(pin, storedHash);

    if (!isValid) {
      const attempt = recordFailedAttempt(memberId);
      return NextResponse.json(
        {
          error: 'wrong_pin',
          attemptsLeft: attempt.attemptsLeft,
          locked: attempt.locked,
        },
        { status: 401 }
      );
    }

    // نجح — نظّف المحاولات
    resetAttempts(memberId);

    // أصدر token للطفل
    const token = await generateChildToken({
      sub: member.userId,
      householdId: member.householdId,
      memberId: member.id,
      role: member.role,
      name: member.user.name,
      age: member.age ?? undefined,
    });

    // نضع نفس الـ token في session و"refresh" (الطفل لا يحتاج refresh حقيقي)
    const cookies = buildSessionCookies(token, token, true);

    const response = NextResponse.json(
      {
        member: {
          id: member.id,
          name: member.user.name,
          role: member.role,
          age: member.age,
          householdId: member.householdId,
        },
      },
      { status: 200 }
    );

    response.headers.append('Set-Cookie', cookies.session);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'validation_error', details: error.errors },
        { status: 422 }
      );
    }
    return handleApiError(error);
  }
}
