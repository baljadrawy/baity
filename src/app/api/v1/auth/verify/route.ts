/**
 * POST /api/v1/auth/verify
 * التحقق من OTP المُولَّد محلياً وإرسالُه عبر Telegram، ثم إصدار JWT.
 *
 * Body: { phone, otp, householdId? }
 * Response: { user, member, tokens } + Set-Cookie (httpOnly)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { prisma } from '@/core/db/prisma';
import { handleApiError } from '@/core/db/with-household';
import { generateParentTokens } from '@/core/auth/jwt';
import { buildSessionCookies } from '@/core/auth/authenticate';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

const MAX_ATTEMPTS = 5;

const verifySchema = z.object({
  phone: z
    .string()
    .transform((p) => convertToWesternDigits(p).replace(/\s/g, ''))
    .pipe(z.string().regex(/^05\d{8}$/)),
  otp: z
    .string()
    .transform((o) => convertToWesternDigits(o))
    .pipe(z.string().regex(/^\d{4,6}$/)),
  householdId: z.string().optional(),
});

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.auth(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'محاولات كثيرة، حاول بعد دقيقة' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { phone, otp, householdId } = verifySchema.parse(body);

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json(
        { error: 'invalid_otp', message: 'رمز التحقق غير صحيح' },
        { status: 401 }
      );
    }

    // أحدث كود غير مستخدم لهذا المستخدم
    const otpRecord = await prisma.otpCode.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'invalid_otp', message: 'لا يوجد رمز فعّال — اطلب رمزاً جديداً' },
        { status: 401 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      });
      return NextResponse.json(
        { error: 'expired_otp', message: 'انتهت صلاحية الرمز — اطلب رمزاً جديداً' },
        { status: 401 }
      );
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { usedAt: new Date() },
      });
      return NextResponse.json(
        { error: 'max_attempts', message: 'تجاوزت عدد المحاولات — اطلب رمزاً جديداً' },
        { status: 401 }
      );
    }

    if (otpRecord.codeHash !== hashCode(otp)) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: 'invalid_otp', message: 'رمز التحقق غير صحيح' },
        { status: 401 }
      );
    }

    // ✓ صحيح — علّمه مستخدماً
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // العضوية
    const member = householdId
      ? await prisma.householdMember.findUnique({
          where: { userId_householdId: { userId: user.id, householdId } },
        })
      : await prisma.householdMember.findFirst({
          where: { userId: user.id },
          orderBy: { joinedAt: 'asc' },
        });

    if (!member) {
      const { signJwt } = await import('@/core/auth/jwt');
      const { SESSION_COOKIE } = await import('@/core/auth/session');
      const tempToken = await signJwt(
        { sub: user.id, householdId: '', memberId: '', role: 'MEMBER', name: '' },
        5 * 60
      );
      const isProduction = process.env['NODE_ENV'] === 'production';
      const tempCookie = [
        `${SESSION_COOKIE}=${tempToken}`,
        'HttpOnly',
        isProduction ? 'Secure;' : '',
        'SameSite=Lax',
        'Path=/',
        `Max-Age=${5 * 60}`,
      ]
        .filter(Boolean)
        .join('; ');

      const res = NextResponse.json(
        {
          needsOnboarding: true,
          userId: user.id,
          accessToken: tempToken,
        },
        { status: 200 }
      );
      res.headers.append('Set-Cookie', tempCookie);
      return res;
    }

    const tokens = await generateParentTokens({
      sub: user.id,
      householdId: member.householdId,
      memberId: member.id,
      role: member.role,
      name: user.name,
    });

    const cookies = buildSessionCookies(tokens.accessToken, tokens.refreshToken);
    const response = NextResponse.json(
      {
        user: { id: user.id, name: user.name, phone: user.phone },
        member: { id: member.id, role: member.role },
        expiresIn: tokens.expiresIn,
      },
      { status: 200 }
    );
    response.headers.append('Set-Cookie', cookies.session);
    response.headers.append('Set-Cookie', cookies.refresh);
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
