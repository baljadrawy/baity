/**
 * Sentry Edge Config — middleware و edge runtime.
 * إذا لم تُعدّ SENTRY_DSN، Sentry يبقى صامتاً (no-op).
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
