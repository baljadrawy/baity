/**
 * Sentry Client Config — يعمل في المتصفح فقط.
 * إذا لم تُعدّ NEXT_PUBLIC_SENTRY_DSN، Sentry يبقى صامتاً (no-op).
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // 10% من المعاملات للأداء — قابل للضبط
    tracesSampleRate: 0.1,
    // Session replay — مفيد للأخطاء البصرية، لكن مكلف. مغلَق افتراضياً.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}
