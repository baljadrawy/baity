/**
 * Next.js instrumentation hook — يُحمَّل قبل أي طلب
 * Sentry v8 يتطلب هذا الملف لتفعيل التغطية على Server و Edge runtimes.
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
