/**
 * نظام تنسيق الأرقام الموحّد — "بيتي"
 *
 * القاعدة الذهبية: كل رقم يُعرض للمستخدم يمر عبر هذه الدوال.
 * المضمون: صفر أرقام هندية (٠-٩) أو فارسية (۰-۹) في أي مكان.
 * الأرقام الوحيدة المسموح بها: 0 1 2 3 4 5 6 7 8 9
 *
 * @see EXECUTION_PLAN_V2.md — قسم "قاعدة الأرقام العربية"
 */

import type { Locale } from '@/i18n/config';

// ============================================================
// الثوابت
// ============================================================

/** النظام الرقمي اللاتيني — يجبر الأرقام العربية الأصلية (0-9) */
const LATIN_NUMBERING = 'latn' as const;

/** Locale الأرقام لكل لغة */
const NUMBER_LOCALES: Record<Locale, string> = {
  ar: 'ar-SA',
  en: 'en-US',
};

// ============================================================
// دوال التحويل والتنظيف
// ============================================================

/**
 * تحويل أي أرقام (هندية أو فارسية) إلى الأرقام العربية الأصلية (0-9).
 * تُستخدم على كل input وارد من المستخدم أو من أي مصدر خارجي.
 *
 * @example
 * convertToWesternDigits('١٢٣') // '123'
 * convertToWesternDigits('۴۵۶') // '456'
 * convertToWesternDigits('789') // '789' (بدون تغيير)
 */
export function convertToWesternDigits(text: string): string {
  return (
    text
      // الأرقام الهندية (U+0660–U+0669) → عربية أصلية
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      // الأرقام الفارسية (U+06F0–U+06F9) → عربية أصلية
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
  );
}

/**
 * فحص: هل النص يحوي أرقاماً ممنوعة (هندية أو فارسية)؟
 * يُستخدم في validators لرفض البيانات الملوّثة.
 */
export function containsForbiddenDigits(text: string): boolean {
  return /[٠-٩۰-۹]/.test(text);
}

// ============================================================
// دوال التنسيق الأساسية
// ============================================================

/**
 * تنسيق رقم — الدالة الأساسية.
 * تجبر الأرقام العربية الأصلية (0-9) بغض النظر عن اللغة.
 *
 * @example
 * formatNumber(1234567, 'ar') // '1,234,567'
 * formatNumber(1234.5, 'ar', { minimumFractionDigits: 2 }) // '1,234.50'
 */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(NUMBER_LOCALES[locale], {
    numberingSystem: LATIN_NUMBERING, // ⭐ يجبر الأرقام العربية الأصلية
    ...options,
  }).format(value);
}

/**
 * تنسيق مبلغ مالي بالريال السعودي.
 *
 * @example
 * formatCurrency(150.5, 'ar') // '150.50 ر.س'
 * formatCurrency(1000, 'en') // 'SAR 1,000.00'
 */
export function formatCurrency(
  value: number,
  locale: Locale,
  currency = 'SAR'
): string {
  return formatNumber(value, locale, {
    style: 'currency',
    currency,
    currencyDisplay: locale === 'ar' ? 'narrowSymbol' : 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * تنسيق تاريخ ميلادي بالأرقام العربية الأصلية.
 *
 * @example
 * formatDate(new Date('2026-04-27'), 'ar') // '27 أبريل 2026'
 * formatDate(new Date('2026-04-27'), 'en') // 'April 27, 2026'
 */
export function formatDate(
  date: Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(NUMBER_LOCALES[locale], {
    numberingSystem: LATIN_NUMBERING, // ⭐ حتى التواريخ بأرقام عربية أصلية
    ...defaultOptions,
    ...options,
  }).format(date);
}

/**
 * تنسيق تاريخ هجري بالأرقام العربية الأصلية.
 * يعرض التاريخ الهجري دائماً بالأرقام العربية الأصلية (0-9).
 *
 * @example
 * formatHijriDate(new Date('2026-04-27'), 'ar') // '9 شوال 1447'
 */
export function formatHijriDate(date: Date, locale: Locale = 'ar'): string {
  return new Intl.DateTimeFormat(NUMBER_LOCALES[locale], {
    numberingSystem: LATIN_NUMBERING, // ⭐ مهم: حتى الهجري بأرقام عربية أصلية
    calendar: 'islamic-umalqura',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * تنسيق تاريخ قصير (للقوائم والبطاقات).
 *
 * @example
 * formatShortDate(new Date('2026-04-27'), 'ar') // '27 أبر 2026'
 */
export function formatShortDate(date: Date, locale: Locale): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * تنسيق "منذ كم" (relative time).
 *
 * @example
 * formatRelativeTime(-3, 'day', 'ar') // 'منذ 3 أيام'
 */
export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  locale: Locale
): string {
  const rtf = new Intl.RelativeTimeFormat(NUMBER_LOCALES[locale], {
    numeric: 'auto',
    style: 'long',
  });
  // formatToParts ثم إعادة تجميع مع تحويل الأرقام
  const parts = rtf.formatToParts(value, unit);
  return parts
    .map((p) => (p.type === 'integer' ? convertToWesternDigits(p.value) : p.value))
    .join('');
}

/**
 * تنسيق رقم الجوال السعودي.
 *
 * @example
 * formatPhoneNumber('0501234567', 'ar') // '050 123 4567'
 */
export function formatPhoneNumber(phone: string, _locale: Locale): string {
  // تنظيف أولاً — تحويل أي أرقام هندية/فارسية
  const normalized = convertToWesternDigits(phone).replace(/\D/g, '');
  // تنسيق: 050 123 4567
  return normalized.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
}

/**
 * تنسيق نسبة مئوية.
 *
 * @example
 * formatPercent(0.75, 'ar') // '75%'
 */
export function formatPercent(value: number, locale: Locale): string {
  return formatNumber(value, locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

/**
 * تنسيق رقم مضغوط (للأرقام الكبيرة).
 *
 * @example
 * formatCompactNumber(1500000, 'ar') // '1.5 مليون'
 */
export function formatCompactNumber(value: number, locale: Locale): string {
  return formatNumber(value, locale, {
    notation: 'compact',
    compactDisplay: 'long',
  });
}
