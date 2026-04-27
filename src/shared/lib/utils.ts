/**
 * Utilities — "بيتي"
 * دوال مساعدة مشتركة في كل المشروع
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * دمج Tailwind classes مع حل التعارضات.
 * الاستخدام: cn('flex', condition && 'mt-4', 'text-sm')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * تأخير بسيط (للاختبار والـ loading states)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * توليد ID فريد قصير (للـ client-side temp IDs)
 * ملاحظة: للـ IDs الحقيقية، استخدم cuid() من Prisma
 */
export function generateTempId(): string {
  return `tmp_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * تقليم النص مع إضافة ... إذا تجاوز الطول
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * فحص: هل قيمة null أو undefined؟
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * تحويل Object لـ URLSearchParams
 */
export function objectToSearchParams(obj: Record<string, string | number | boolean>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (!isNullish(value)) {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

/**
 * Omit keys من object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Pick keys من object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
