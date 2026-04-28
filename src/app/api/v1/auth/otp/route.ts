/**
 * POST /api/v1/auth/otp
 * إرسال رمز OTP عبر Telegram (مجاني، بديل عن Supabase Phone OTP)
 *
 * Body: { phone: string }
 * Response:
 *   200 — { message } — رُسل
 *   404 — { error: 'not_linked', botUsername } — يحتاج /start البوت أولاً
 *   422 — تحقق من الـ schema فشل
 *   429 — rate limit
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash, randomInt } from 'crypto';
import { prisma } from '@/core/db/prisma';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import { handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { sendMessage } from '@/core/notifications/telegram';

const OTP_EXPIRY_MIN = 5;

const otpRequestSchema = z.object({
  phone: z
    .string()
    .transform((p) => convertToWesternDigits(p).replace(/\s/g, ''))
    .pipe(
      z
        .string()
        .regex(/^05\d{8}$/, 'رقم الجوال يجب أن يبدأ بـ 05 ويكون 10 أرقام')
    ),
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
        { error: 'rate_limited', message: 'طلبات كثيرة، حاول بعد دقيقة' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { phone } = otpRequestSchema.parse(body);

    // ابحث عن المستخدم — إن لم يوجد، أنشئه (placeholder name، يكتمل في onboarding)
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: phone },
      });
    }

    // تحقق أن المستخدم ربط Telegram
    if (!user.telegramChatId) {
      const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'baity_bot';
      return NextResponse.json(
        {
          error: 'not_linked',
          message: 'يلزم ربط حسابك بـ Telegram أولاً',
          botUsername,
        },
        { status: 404 }
      );
    }

    // ولّد كود من 6 أرقام
    const code = String(randomInt(100000, 1000000));
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60_000);

    // ألغِ الأكواد السابقة غير المستخدمة لنفس المستخدم (لمنع stack)
    await prisma.otpCode.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.otpCode.create({
      data: { userId: user.id, codeHash, expiresAt },
    });

    // أرسل عبر Telegram
    const sent = await sendMessage(
      user.telegramChatId,
      `🔐 رمز تسجيل الدخول إلى <b>بيتي</b>:\n\n<code>${code}</code>\n\nصالح لمدة ${OTP_EXPIRY_MIN} دقائق. لا تشاركه مع أحد.`
    );

    if (!sent) {
      return NextResponse.json(
        { error: 'send_failed', message: 'فشل إرسال الرمز عبر Telegram' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { message: 'تم إرسال رمز التحقق', phone },
      { status: 200 }
    );
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
