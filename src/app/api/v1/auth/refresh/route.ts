/**
 * POST /api/v1/auth/refresh
 * تجديد الـ Access Token عبر Refresh Token
 *
 * Cookie: baity_refresh (httpOnly)
 * Response: { expiresIn } + Set-Cookie (access token جديد)
 *
 * الأمان:
 * - Refresh token يُقرأ من httpOnly cookie فقط
 * - يتحقق من صحة الـ JWT وصلاحيته
 * - يُصدر access token جديد فقط (لا rotation للـ refresh في MVP)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getRefreshToken, buildSessionCookies } from '@/core/auth/authenticate';
import { verifyJwt, generateParentTokens } from '@/core/auth/jwt';
import { handleApiError, UnauthorizedError } from '@/core/db/with-household';
import { PARENT_ACCESS_TOKEN_TTL } from '@/core/auth/session';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = getRefreshToken(req);

    if (!refreshToken) {
      throw new UnauthorizedError('no refresh token');
    }

    // التحقق من صحة الـ refresh token
    const payload = await verifyJwt(refreshToken);

    // إصدار access token جديد
    const tokens = await generateParentTokens({
      sub: payload.userId,
      householdId: payload.householdId,
      memberId: payload.memberId,
      role: payload.role,
      name: payload.name,
    });

    const cookies = buildSessionCookies(tokens.accessToken, refreshToken); // نحتفظ بنفس الـ refresh

    const response = NextResponse.json(
      { expiresIn: PARENT_ACCESS_TOKEN_TTL },
      { status: 200 }
    );

    response.headers.append('Set-Cookie', cookies.session);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
