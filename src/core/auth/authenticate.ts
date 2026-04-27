/**
 * authenticate() — التحقق من هوية المستخدم
 *
 * يقبل طريقتين (للويب والجوال):
 * 1. httpOnly Cookie → للويب (أكثر أماناً)
 * 2. Authorization: Bearer <token> → للجوال مستقبلاً
 *
 * القاعدة: كل API route يستدعي authenticate() أولاً.
 *
 * @example
 * export async function GET(req: Request) {
 *   const session = await authenticate(req);
 *   // session.userId, session.householdId, session.role
 * }
 */

import { type NextRequest } from 'next/server';
import { verifyJwt } from './jwt';
import { UnauthorizedError } from '@/core/db/with-household';
import type { Session } from './session';
import { REFRESH_COOKIE, SESSION_COOKIE } from './session';

/**
 * يستخرج ويتحقق من الـ session من الطلب.
 * يرمي UnauthorizedError إذا لم يكن مسجّلاً.
 */
export async function authenticate(req: NextRequest | Request): Promise<Session> {
  // 1. محاولة من Authorization header (للجوال)
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      return await verifyJwt(token);
    } catch {
      throw new UnauthorizedError('invalid or expired bearer token');
    }
  }

  // 2. محاولة من Cookie (للويب)
  let cookieToken: string | undefined;

  if (req instanceof Request) {
    // Standard Request — استخراج Cookie يدوياً
    const cookieHeader = req.headers.get('cookie') ?? '';
    const cookies = parseCookies(cookieHeader);
    cookieToken = cookies[SESSION_COOKIE];
  } else {
    // NextRequest — يملك .cookies
    cookieToken = req.cookies.get(SESSION_COOKIE)?.value;
  }

  if (cookieToken) {
    try {
      return await verifyJwt(cookieToken);
    } catch {
      throw new UnauthorizedError('invalid or expired session');
    }
  }

  throw new UnauthorizedError('no authentication provided');
}

/**
 * استخراج الـ refresh token من الـ Cookie
 */
export function getRefreshToken(req: NextRequest): string | undefined {
  return req.cookies.get(REFRESH_COOKIE)?.value;
}

/**
 * بناء Set-Cookie headers للـ tokens
 */
export function buildSessionCookies(
  accessToken: string,
  refreshToken: string,
  isChild = false
): { session: string; refresh: string } {
  const isProduction = process.env['NODE_ENV'] === 'production';
  const secure = isProduction ? 'Secure; ' : '';
  const sessionMaxAge = isChild ? 24 * 60 * 60 : 15 * 60;
  const refreshMaxAge = 30 * 24 * 60 * 60;

  const sessionCookie = [
    `${SESSION_COOKIE}=${accessToken}`,
    `HttpOnly`,
    `${secure}SameSite=Lax`,
    `Path=/`,
    `Max-Age=${sessionMaxAge}`,
  ].join('; ');

  const refreshCookie = [
    `${REFRESH_COOKIE}=${refreshToken}`,
    `HttpOnly`,
    `${secure}SameSite=Lax`,
    `Path=/api/v1/auth/refresh`,
    `Max-Age=${refreshMaxAge}`,
  ].join('; ');

  return { session: sessionCookie, refresh: refreshCookie };
}

/**
 * Cookie header لتسجيل الخروج (تنظيف الـ cookies)
 */
export function buildLogoutCookies(): { session: string; refresh: string } {
  return {
    session: `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
    refresh: `${REFRESH_COOKIE}=; HttpOnly; SameSite=Lax; Path=/api/v1/auth/refresh; Max-Age=0`,
  };
}

// ============================================================
// Helpers
// ============================================================

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...val] = c.trim().split('=');
      return [key?.trim() ?? '', val.join('=').trim()];
    })
  );
}
