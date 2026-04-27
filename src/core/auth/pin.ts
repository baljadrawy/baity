/**
 * PIN Management للأطفال — "بيتي"
 *
 * القواعد:
 * - PIN 4 أرقام — bcrypt hash (rounds=12)
 * - 5 محاولات فاشلة → قفل 15 دقيقة
 * - الأرقام: 0-9 فقط (نحوّل الهندية/الفارسية تلقائياً)
 */

import bcrypt from 'bcryptjs';
import { convertToWesternDigits } from '@/core/i18n/format-number';

const BCRYPT_ROUNDS = 12;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// ============================================================
// في-memory rate limiting (يُستبدل بـ Redis في الإنتاج)
// ============================================================

interface AttemptRecord {
  count: number;
  lockedUntil?: Date;
}

const attemptMap = new Map<string, AttemptRecord>();

// ============================================================
// PIN Functions
// ============================================================

/**
 * تنظيف الـ PIN: تحويل الهندية/الفارسية + التحقق من الصحة
 */
export function sanitizePin(pin: string): string {
  return convertToWesternDigits(pin).replace(/\D/g, '');
}

/**
 * التحقق من صحة الـ PIN (4 أرقام 0-9)
 */
export function isValidPin(pin: string): boolean {
  const clean = sanitizePin(pin);
  return /^\d{4}$/.test(clean);
}

/**
 * تشفير الـ PIN
 */
export async function hashPin(pin: string): Promise<string> {
  const clean = sanitizePin(pin);
  if (!isValidPin(clean)) throw new Error('invalid PIN format');
  return bcrypt.hash(clean, BCRYPT_ROUNDS);
}

/**
 * مقارنة PIN مع الـ hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const clean = sanitizePin(pin);
  return bcrypt.compare(clean, hash);
}

// ============================================================
// Rate Limiting
// ============================================================

/**
 * هل الحساب مقفول؟
 */
export function isLocked(memberId: string): { locked: boolean; minutesLeft?: number } {
  const record = attemptMap.get(memberId);
  if (!record?.lockedUntil) return { locked: false };

  const now = new Date();
  if (record.lockedUntil > now) {
    const minutesLeft = Math.ceil(
      (record.lockedUntil.getTime() - now.getTime()) / 60000
    );
    return { locked: true, minutesLeft };
  }

  // انتهى القفل — نظّف
  attemptMap.delete(memberId);
  return { locked: false };
}

/**
 * تسجيل محاولة فاشلة
 * يُرجع: عدد المحاولات المتبقية، أو {locked: true} إذا وصل الحد
 */
export function recordFailedAttempt(memberId: string): {
  attemptsLeft: number;
  locked: boolean;
  minutesLeft?: number;
} {
  const record = attemptMap.get(memberId) ?? { count: 0 };
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    attemptMap.set(memberId, record);
    return { attemptsLeft: 0, locked: true, minutesLeft: LOCKOUT_MINUTES };
  }

  attemptMap.set(memberId, record);
  return { attemptsLeft: MAX_ATTEMPTS - record.count, locked: false };
}

/**
 * إعادة تعيين عداد المحاولات بعد تسجيل دخول ناجح
 */
export function resetAttempts(memberId: string): void {
  attemptMap.delete(memberId);
}
