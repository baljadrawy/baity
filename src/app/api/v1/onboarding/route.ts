/**
 * POST /api/v1/onboarding — إنشاء المنزل واسم المستخدم عند التسجيل الأول
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate, buildSessionCookies } from '@/core/auth/authenticate';
import { handleApiError } from '@/core/db/with-household';
import { prisma } from '@/core/db';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { generateParentTokens } from '@/core/auth/jwt';
import { sendMessage, welcomeOwnerTemplate } from '@/core/notifications/telegram';

const onboardingSchema = z.object({
  householdName: z.string().min(1).max(100),
  userName: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const { householdName, userName } = onboardingSchema.parse(body);

    // تحديث اسم المستخدم
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { name: userName },
    });

    // إذا كان لديه household بالفعل، فقط حدّث الاسم
    if (session.householdId) {
      await prisma.household.update({
        where: { id: session.householdId },
        data: { name: householdName },
      });
      return NextResponse.json({ success: true });
    }

    // إنشاء household جديد + OWNER + Subscription (FREE_TRIAL ٣٠ يوم)
    const trialEnd = new Date(Date.now() + 30 * 86400000);
    const household = await prisma.household.create({
      data: {
        name: householdName,
        members: {
          create: {
            userId: session.userId,
            role: 'OWNER',
          },
        },
        subscription: {
          create: {
            plan: 'FREE_TRIAL',
            status: 'IN_TRIAL',
            currentPeriodEnd: trialEnd,
            events: {
              create: { type: 'TRIAL_STARTED' },
            },
          },
        },
      },
      include: { members: { where: { userId: session.userId } } },
    });

    const member = household.members[0];
    if (!member) {
      throw new Error('فشل إنشاء عضوية المستخدم');
    }

    // رسالة ترحيب عبر Telegram — graceful: لا نُفشل onboarding إن فشل الإرسال
    const userWithChat = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { telegramChatId: true },
    });
    if (userWithChat?.telegramChatId) {
      const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://pi-server:3001';
      const welcome = welcomeOwnerTemplate(user.name, household.name, appUrl);
      sendMessage(userWithChat.telegramChatId, welcome).catch((err) => {
        console.warn('[onboarding] welcome telegram failed:', err);
      });
    }

    // إصدار جلسة كاملة (تُستبدل الجلسة المؤقتة من /verify)
    const tokens = await generateParentTokens({
      sub: user.id,
      householdId: household.id,
      memberId: member.id,
      role: member.role,
      name: user.name,
    });
    const cookies = buildSessionCookies(tokens.accessToken, tokens.refreshToken);

    const res = NextResponse.json(
      { success: true, householdId: household.id },
      { status: 201 }
    );
    res.headers.append('Set-Cookie', cookies.session);
    res.headers.append('Set-Cookie', cookies.refresh);
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
