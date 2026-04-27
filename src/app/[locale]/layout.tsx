/**
 * [locale]/layout.tsx — "بيتي"
 *
 * القواعد المُطبَّقة هنا:
 * 1. lang="ar-SA-u-nu-latn" — يجبر الأرقام العربية الأصلية (0-9) عبر Unicode extension
 * 2. dir="rtl/ltr" — يُحدَّد ديناميكياً حسب اللغة
 * 3. خط IBM Plex Sans Arabic للعربية
 * 4. next-intl provider
 */

import { IBM_Plex_Sans_Arabic, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { localeConfig, locales, type Locale } from '@/i18n/config';
import { QueryProvider } from '@/shared/components/QueryProvider';
import { PwaInstallPrompt } from '@/shared/components/pwa/PwaInstallPrompt';
import { features } from '@/core/config/features';

// ---- الخطوط ----
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  preload: true,
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-latin',
  display: 'swap',
  preload: true,
});

// ---- generateStaticParams (SSG optimization) ----
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// ---- Props ----
interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // التحقق من صحة الـ locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const config = localeConfig[typedLocale];

  // تحميل الترجمات من server
  const messages = await getMessages();

  return (
    <html
      lang={config.htmlLang}
      dir={config.dir}
      className={`${ibmPlexArabic.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* منع iOS من تحويل الأرقام */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        {/* تسجيل Service Worker للـ PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function(e) {
      console.warn('SW registration failed:', e);
    });
  });
}
            `.trim(),
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{
          fontFamily:
            typedLocale === 'ar' ? 'var(--font-arabic), system-ui' : 'var(--font-latin), system-ui',
        }}
      >
        <NextIntlClientProvider messages={messages} locale={typedLocale}>
          <QueryProvider>
            {children}
            {features.pwa && <PwaInstallPrompt />}
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
