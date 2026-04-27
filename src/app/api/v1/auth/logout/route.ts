/**
 * POST /api/v1/auth/logout
 * تسجيل الخروج — مسح الـ cookies
 *
 * Response: { message: 'logged out' }
 * Side effect: Set-Cookie بـ Max-Age=0 لتصفير الـ session والـ refresh
 */

import { NextResponse } from 'next/server';
import { buildLogoutCookies } from '@/core/auth/authenticate';

export async function POST() {
  const cookies = buildLogoutCookies();

  const response = NextResponse.json({ message: 'logged out' }, { status: 200 });

  response.headers.append('Set-Cookie', cookies.session);
  response.headers.append('Set-Cookie', cookies.refresh);

  return response;
}
