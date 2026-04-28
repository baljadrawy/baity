/**
 * useFormat — Hook موحّد لتنسيق الأرقام والتواريخ
 *
 * الاستخدام الإجباري: أي رقم أو تاريخ يُعرض للمستخدم يمر عبر هذا الـ hook.
 * ESLint يرفض استخدام .toLocaleString() أو الأرقام الحرفية مباشرة.
 *
 * @example
 * const f = useFormat();
 * f.currency(150.5)     // '150.50 ر.س'
 * f.number(1234)        // '1,234'
 * f.date(new Date())    // '27 أبريل 2026'
 * f.hijri(new Date())   // '9 شوال 1447'
 * f.phone('0501234567') // '050 123 4567'
 */

'use client';

import { useLocale } from 'next-intl';
import {
  convertToWesternDigits,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatHijriDate,
  formatNumber,
  formatPercent,
  formatPhoneNumber,
  formatRelativeTime,
  formatShortDate,
} from '@/core/i18n/format-number';
import type { Locale } from '@/i18n/config';

export function useFormat() {
  const locale = useLocale() as Locale;

  return {
    /** تنسيق رقم عادي */
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, locale, options),

    /** تنسيق مبلغ مالي بالريال السعودي */
    currency: (value: number) => formatCurrency(value, locale),

    /** تنسيق تاريخ ميلادي — متسامح مع null/string/تاريخ غير صحيح */
    date: (
      date: Date | string | null | undefined,
      options?: Intl.DateTimeFormatOptions
    ) => {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(d.getTime())) return '';
      return formatDate(d, locale, options);
    },

    /** تنسيق تاريخ ميلادي قصير — متسامح */
    shortDate: (date: Date | string | null | undefined) => {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(d.getTime())) return '';
      return formatShortDate(d, locale);
    },

    /** تنسيق تاريخ هجري — متسامح */
    hijri: (date: Date | string | null | undefined) => {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(d.getTime())) return '';
      return formatHijriDate(d, locale);
    },

    /** تنسيق رقم الجوال */
    phone: (phone: string) => formatPhoneNumber(phone, locale),

    /** تنسيق نسبة مئوية */
    percent: (value: number) => formatPercent(value, locale),

    /** تنسيق رقم مضغوط */
    compact: (value: number) => formatCompactNumber(value, locale),

    /** تنسيق وقت نسبي */
    relative: (value: number, unit: Intl.RelativeTimeFormatUnit) =>
      formatRelativeTime(value, unit, locale),

    /** تحويل الأرقام الهندية/الفارسية لعربية أصلية (للـ inputs) */
    clean: (text: string) => convertToWesternDigits(text),

    /** الـ locale الحالي */
    locale,

    /** اتجاه النص */
    dir: locale === 'ar' ? ('rtl' as const) : ('ltr' as const),
  };
}
