/**
 * getServerSession() — الحصول على الجلسة في Server Components
 *
 * يستخدم next/headers للوصول للـ cookies بدون NextRequest.
 * يُستخدم حصراً في Server Components وServer Actions.
 *
 * @example
 * const session = await getServerSession();
 * if (!session) redirect('/login');
 */

import { cookies } from 'next/headers';
import { verifyJwt } from './jwt';
import type { Session } from './session';
import { SESSION_COOKIE } from './session';

/**
 * يُرجع الجلسة الحالية أو null إذا لم يكن مسجّلاً.
 * Non-throwing — آمن للاستخدام في Server Components.
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return await verifyJwt(token);
  } catch {
    return null;
  }
}

/**
 * يُرجع الجلسة أو يرمي redirect إذا لم يكن مسجّلاً.
 * استخدم في صفحات المحمية فقط.
 */
export async function requireServerSession(): Promise<Session> {
  const { redirect } = await import('next/navigation');
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}
