/**
 * POST /api/v1/auth/verify
 * التحقق من OTP وإصدار JWT
 *
 * Body: { phone, otp, householdId? }
 * Response: { user, member, tokens } + Set-Cookie (httpOnly)
 *
 * التدفق:
 * 1. تحقق من OTP عبر Supabase
 * 2. ابحث أو أنشئ User
 * 3. إذا householdId → تحقق من العضوية
 * 4. أصدر JWT pair وضعه في httpOnly cookies
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/core/db/prisma';
import { handleApiError } from '@/core/db/with-household';
import { generateParentTokens } from '@/core/auth/jwt';
import { buildSessionCookies } from '@/core/auth/authenticate';
import { convertToWesternDigits } from '@/core/i18n/format-number';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp, householdId } = verifySchema.parse(body);

    // TODO: التحقق من OTP عبر Supabase
    // const supabase = createClient(supabaseUrl, serviceRoleKey);
    // const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    // if (error) throw new UnauthorizedError('invalid OTP');

    // مؤقت للتطوير
    if (process.env['NODE_ENV'] === 'development' && otp !== '1234') {
      return NextResponse.json({ error: 'invalid OTP' }, { status: 401 });
    }

    // البحث أو إنشاء User
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: phone }, // الاسم يُحدَّث لاحقاً في الـ onboarding
      });
    }

    // البحث عن العضوية
    let member = householdId
      ? await prisma.householdMember.findUnique({
          where: { userId_householdId: { userId: user.id, householdId } },
        })
      : await prisma.householdMember.findFirst({
          where: { userId: user.id },
          orderBy: { joinedAt: 'asc' },
        });

    // إذا لم يكن عضواً بعد → يحتاج Onboarding
    if (!member) {
      return NextResponse.json(
        {
          needsOnboarding: true,
          userId: user.id,
          accessToken: await generateTempToken(user.id),
        },
        { status: 200 }
      );
    }

    // إصدار JWT pair
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

// مؤقت — يُستبدل بـ Supabase session
async function generateTempToken(userId: string): Promise<string> {
  const { signJwt } = await import('@/core/auth/jwt');
  return signJwt(
    { sub: userId, householdId: '', memberId: '', role: 'MEMBER', name: '' },
    5 * 60 // 5 دقائق فقط للـ onboarding
  );
}
