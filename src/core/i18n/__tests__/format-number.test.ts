/**
 * Unit Tests — نظام الأرقام العربية
 *
 * القاعدة الذهبية: صفر أرقام هندية (٠-٩) أو فارسية (۰-۹) في أي مكان من الإنتاج.
 * هذه الاختبارات تضمن عدم التراجع عن هذه القاعدة.
 *
 * استثناء واعٍ: هذا الملف يحتاج حرفياً لأرقام هندية وفارسية كمدخلات اختبار
 * لدوال التحويل نفسها. الاستثناء محصور في ملف الاختبار فقط — قاعدة المنع
 * تبقى فعّالة على كل كود الإنتاج.
 *
 * Coverage مطلوبة: 100% على هذا الملف
 */
/* eslint-disable no-restricted-syntax */

import { describe, expect, it } from 'vitest';
import {
  containsForbiddenDigits,
  convertToWesternDigits,
  formatCurrency,
  formatDate,
  formatHijriDate,
  formatNumber,
  formatPhoneNumber,
} from '../format-number';

// نمط التحقق من الأرقام المسموحة فقط
const ONLY_WESTERN_DIGITS = /^[^٠-٩۰-۹]*$/;

// ============================================================
// convertToWesternDigits
// ============================================================
describe('convertToWesternDigits', () => {
  it('يحوّل الأرقام الهندية للعربية الأصلية', () => {
    expect(convertToWesternDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('يحوّل الأرقام الفارسية للعربية الأصلية', () => {
    expect(convertToWesternDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('لا يغيّر الأرقام العربية الأصلية', () => {
    expect(convertToWesternDigits('0123456789')).toBe('0123456789');
  });

  it('يعالج النص المختلط', () => {
    expect(convertToWesternDigits('المبلغ: ١٢٣ ر.س')).toBe('المبلغ: 123 ر.س');
    expect(convertToWesternDigits('رقم: ۴۵۶')).toBe('رقم: 456');
  });

  it('يتعامل مع النص الفارغ', () => {
    expect(convertToWesternDigits('')).toBe('');
  });

  it('يتعامل مع النصوص بدون أرقام', () => {
    expect(convertToWesternDigits('مرحبا')).toBe('مرحبا');
  });
});

// ============================================================
// containsForbiddenDigits
// ============================================================
describe('containsForbiddenDigits', () => {
  it('يكتشف الأرقام الهندية', () => {
    expect(containsForbiddenDigits('المبلغ ١٢٣')).toBe(true);
    expect(containsForbiddenDigits('٠')).toBe(true);
  });

  it('يكتشف الأرقام الفارسية', () => {
    expect(containsForbiddenDigits('الرقم ۱۲۳')).toBe(true);
    expect(containsForbiddenDigits('۰')).toBe(true);
  });

  it('لا يُبلّغ عن الأرقام العربية الأصلية', () => {
    expect(containsForbiddenDigits('المبلغ 123')).toBe(false);
    expect(containsForbiddenDigits('hello 456 world')).toBe(false);
  });

  it('لا يُبلّغ عن النص بدون أرقام', () => {
    expect(containsForbiddenDigits('مرحبا بالعالم')).toBe(false);
  });
});

// ============================================================
// formatNumber
// ============================================================
describe('formatNumber', () => {
  it('يُنسّق رقم بالعربية بدون أرقام هندية', () => {
    const result = formatNumber(1234, 'ar');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
    expect(result).toContain('1');
  });

  it('يُنسّق رقم بالإنجليزية', () => {
    const result = formatNumber(1234, 'en');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
    expect(result).toContain('1');
  });

  it('يُنسّق الأصفار', () => {
    expect(formatNumber(0, 'ar')).toMatch(ONLY_WESTERN_DIGITS);
    expect(formatNumber(0, 'en')).toMatch(ONLY_WESTERN_DIGITS);
  });

  it('يُنسّق الأرقام الكبيرة', () => {
    const result = formatNumber(1_000_000, 'ar');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
  });

  it('يُنسّق الأرقام العشرية', () => {
    const result = formatNumber(1234.567, 'ar', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
  });
});

// ============================================================
// formatCurrency
// ============================================================
describe('formatCurrency', () => {
  it('يُنسّق مبلغ ريال سعودي بالعربية بدون أرقام هندية', () => {
    const result = formatCurrency(150.5, 'ar');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
    expect(result).toContain('1');
    expect(result).toContain('5');
  });

  it('يُنسّق مبلغ ريال سعودي بالإنجليزية', () => {
    const result = formatCurrency(150.5, 'en');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
    expect(result).toContain('150');
  });

  it('يُنسّق الأصفار', () => {
    const result = formatCurrency(0, 'ar');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
  });

  it('يُنسّق مبالغ كبيرة', () => {
    const result = formatCurrency(10_000, 'ar');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
  });
});

// ============================================================
// formatDate
// ============================================================
describe('formatDate', () => {
  const testDate = new Date('2026-04-27');

  it('يُنسّق تاريخ ميلادي بالعربية بدون أرقام هندية', () => {
    const result = formatDate(testDate, 'ar');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
    // يجب أن يحتوي على السنة
    expect(result).toContain('2026');
  });

  it('يُنسّق تاريخ ميلادي بالإنجليزية', () => {
    const result = formatDate(testDate, 'en');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
    expect(result).toContain('2026');
  });
});

// ============================================================
// formatHijriDate
// ============================================================
describe('formatHijriDate', () => {
  const testDate = new Date('2026-04-27');

  it('يُنسّق تاريخ هجري بأرقام عربية أصلية (لا هندية)', () => {
    const result = formatHijriDate(testDate, 'ar');
    // القاعدة الأهم: لا أرقام هندية حتى في التاريخ الهجري
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
    // يجب أن يحتوي على 1447
    expect(result).toContain('1447');
  });
});

// ============================================================
// formatPhoneNumber
// ============================================================
describe('formatPhoneNumber', () => {
  it('يُنسّق رقم جوال سعودي', () => {
    const result = formatPhoneNumber('0501234567', 'ar');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
    expect(result).toContain('050');
  });

  it('يُحوّل الأرقام الهندية في رقم الجوال', () => {
    const result = formatPhoneNumber('٠٥٠١٢٣٤٥٦٧', 'ar');
    expect(result).toMatch(ONLY_WESTERN_DIGITS);
    expect(result).toContain('050');
  });
});
