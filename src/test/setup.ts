/**
 * Vitest Setup — "بيتي"
 * يُشغَّل قبل كل test suite
 */

import '@testing-library/jest-dom';

// ---- Mock next-intl في الاختبارات ----
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'ar',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ---- Mock next/navigation ----
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/ar/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// ---- Intl مدعوم في jsdom بشكل كافٍ للاختبارات ----
// إذا احتجنا polyfills إضافية نضيفها هنا
