/**
 * Super-Admin Helper
 *
 * يحدد ما إذا كان المستخدم super-admin (يرى لوحة /admin، يدير كل البيوت).
 * التحقق بمطابقة phone مع `ADMIN_PHONE_NUMBERS` env (CSV).
 *
 * مثال env:
 *   ADMIN_PHONE_NUMBERS=0501234567,0507654321
 *
 * هذا منفصل عن دور `OWNER` في BIT — Owner يدير بيته فقط، super-admin يدير المنصة.
 */

import { prisma } from '@/core/db';
import { convertToWesternDigits } from '@/core/i18n/format-number';

let _cache: Set<string> | null = null;

function getAdminPhones(): Set<string> {
  if (_cache) return _cache;
  const raw = process.env['ADMIN_PHONE_NUMBERS'] ?? '';
  _cache = new Set(
    raw
      .split(',')
      .map((p) => convertToWesternDigits(p).trim().replace(/\s+/g, ''))
      .filter(Boolean)
  );
  return _cache;
}

/** عدد الـ super-admins المُعدّين — للتحقق من إعدادات الـ env */
export function adminCount(): number {
  return getAdminPhones().size;
}

/** هل phone مُعتَمد كـ super-admin؟ */
export function isSuperAdminPhone(phone: string): boolean {
  return getAdminPhones().has(phone);
}

/** هل userId الحالي super-admin؟ يستعلم DB لجلب phone */
export async function isSuperAdminUser(userId: string): Promise<boolean> {
  if (getAdminPhones().size === 0) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  return user ? isSuperAdminPhone(user.phone) : false;
}
