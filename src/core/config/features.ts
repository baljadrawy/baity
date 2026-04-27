/**
 * Feature Flags — "بيتي"
 *
 * القاعدة: الميزات الجديدة تبدأ مُعطَّلة (false) حتى تكتمل وتُختبر.
 * التحكم: .env.local أو CI environment variables.
 *
 * @example
 * // في الـ component
 * import { features } from '@/core/config/features';
 * {features.houseEconomy && <WalletWidget />}
 */

function env(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];
  if (val === undefined) return defaultValue;
  return val === 'true' || val === '1';
}

export const features = {
  /** اقتصاد البيت للأطفال — الوحدة التربوية الكاملة */
  houseEconomy: env('FEATURE_HOUSE_ECONOMY', true),

  /** OCR للضمانات والفواتير المصوّرة */
  warrantyOcr: env('FEATURE_WARRANTY_OCR', false), // يحتاج OpenAI API

  /** Telegram Bot — إشعارات وتحديثات */
  telegramBot: env('FEATURE_TELEGRAM', true),

  /** تكامل الصدقات (مرحلة 2) */
  charityIntegration: env('FEATURE_CHARITY', false),

  /** بنك العائلة — قروض وادخار عائلي (مرحلة 3) */
  familyBank: env('FEATURE_FAMILY_BANK', false),

  /** وضع الـ SaaS — اشتراكات وفواتير */
  saasMode: env('FEATURE_SAAS', false),

  /** QR Code للأجهزة (HomeBox-inspired) */
  applianceQr: env('FEATURE_APPLIANCE_QR', true),

  /** PWA Service Worker */
  pwa: env('FEATURE_PWA', true),

  /** التقويم الهجري في لوحة التحكم */
  hijriCalendar: env('FEATURE_HIJRI_CALENDAR', true),

  /** شهادات الإنجاز PDF للأطفال */
  achievementCertificates: env('FEATURE_CERTIFICATES', true),
} as const;

export type FeatureKey = keyof typeof features;
