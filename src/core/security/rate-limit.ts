/**
 * Rate Limiting — Edge-compatible (بدون Redis في المرحلة الأولى)
 *
 * يستخدم Map في الذاكرة للـ development.
 * في الإنتاج: سيُستبدَل بـ Upstash Redis عبر @upstash/ratelimit.
 *
 * حدود API:
 * - /api/v1/auth/*: 5 طلبات / دقيقة (صارم)
 * - /api/v1/*: 60 طلب / دقيقة
 * - /api/v1/upload: 10 طلبات / دقيقة
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (يُعاد تهيئته عند إعادة التشغيل)
const store = new Map<string, RateLimitEntry>();

// تنظيف تلقائي كل 5 دقائق
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * تحقق من حد المعدل لمعرّف معين (IP أو userId)
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const key = `rl:${identifier}`;
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // نافذة جديدة
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs, limit };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  return { success, remaining, resetAt: entry.resetAt, limit };
}

/**
 * حدود محددة مسبقاً
 */
export const rateLimits = {
  /** Auth endpoints — صارم */
  auth: (ip: string) => checkRateLimit(`auth:${ip}`, 5, 60_000),

  /** API عام */
  api: (ip: string) => checkRateLimit(`api:${ip}`, 60, 60_000),

  /** رفع الملفات */
  upload: (ip: string) => checkRateLimit(`upload:${ip}`, 10, 60_000),
} as const;

/**
 * استخرج IP من Next.js request headers
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}
