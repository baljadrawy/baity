/**
 * Middleware — "بيتي"
 * يُعالج: 1) توجيه اللغة (next-intl) 2) حماية الصفحات (Auth)
 */

import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales } from './i18n/config';

// ---- الصفحات العامة (لا تحتاج تسجيل دخول) ----
const PUBLIC_PAGES = ['/login', '/auth', '/'];

// ---- صفحات المصادقة ----
const AUTH_PAGES = ['/login', '/auth'];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  // locale detection: نقرأ من الـ URL أولاً، ثم Accept-Language
  localeDetection: true,
  // /ar/... أو /en/...
  localePrefix: 'always',
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---- تجاهل الملفات الثابتة والـ API ----
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ---- تطبيق i18n middleware ----
  const response = intlMiddleware(request);

  // ---- فحص المصادقة (بسيط — يُكمل في اليوم 3) ----
  // TODO: اليوم 3 — إضافة JWT verification كاملة
  const sessionCookie = request.cookies.get('session');
  const isPublicPage = PUBLIC_PAGES.some((page) =>
    pathname.replace(/^\/(ar|en)/, '').startsWith(page)
  );
  const isAuthPage = AUTH_PAGES.some((page) =>
    pathname.replace(/^\/(ar|en)/, '').startsWith(page)
  );

  // لو مش مسجّل ومحاول يدخل صفحة محمية
  if (!sessionCookie && !isPublicPage && !isAuthPage) {
    const locale = pathname.split('/')[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // لو مسجّل ويحاول يفتح صفحة المصادقة
  if (sessionCookie && isAuthPage) {
    const locale = pathname.split('/')[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return response;
}

export const config = {
  // تطبيق الـ middleware على كل الصفحات ما عدا الثابتة
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
