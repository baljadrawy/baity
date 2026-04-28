import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // ---- Docker standalone output ----
  output: 'standalone',

  // ---- الأداء ----
  compress: true,
  poweredByHeader: false,

  // ---- الصور ----
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // ---- Security Headers ----
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js يحتاج هذا في dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ---- TypeScript ----
  typescript: {
    ignoreBuildErrors: false,
  },

  // ---- ESLint ----
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ---- Experimental ----
  // typedRoutes معطّلة: لا تتعامل جيداً مع locale prefix الديناميكي من next-intl
  // (كل route حقيقي هو /[locale]/X لكن الكود يكتبه /X والـ middleware يضيف locale)
  experimental: {},
};

// Sentry يلتفّ على next.config — إذا DSN غير معدّ، البناء يستمر بدون رفع source maps
export default withSentryConfig(withNextIntl(nextConfig), {
  // الأخطاء الصامتة في البناء عند غياب التوكن (للتطوير المحلي / CI بدون secret)
  silent: true,
  // رفع source maps فقط إذا SENTRY_AUTH_TOKEN موجود (production CI)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
