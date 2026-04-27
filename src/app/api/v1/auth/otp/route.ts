/**
 * POST /api/v1/auth/otp
 * إرسال OTP عبر Supabase Auth (Phone OTP)
 *
 * Body: { phone: string }
 * Response: { message: string }
 *
 * القواعد:
 * - Rate limiting: 5 req/دقيقة/IP
 * - Phone: سعودي فقط (يبدأ بـ 05)
 * - لا كلمات مرور — OTP فقط
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import { handleApiError } from '@/core/db/with-household';

// Zod schema للـ phone
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = otpRequestSchema.parse(body);

    // TODO: تفعيل Supabase Auth
    // const supabase = createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey);
    // const { error } = await supabase.auth.signInWithOtp({ phone });
    // if (error) throw error;

    // مؤقت للتطوير — نُعيد نجاحاً دائماً
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[DEV] OTP لـ ${phone}: 1234`);
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
