/**
 * Web Push — وحدة الإشعارات عبر المتصفح
 *
 * يستخدم VAPID + Web Push Protocol عبر مكتبة `web-push`.
 * إن لم تُعَدّ الـ VAPID keys في env، الدوال تُسجّل warning وتعود `false` بدون رمي خطأ.
 *
 * المتغيرات البيئية المطلوبة لتفعيل الإرسال:
 *   - VAPID_PUBLIC_KEY  (يُشارك مع المتصفح للاشتراك)
 *   - VAPID_PRIVATE_KEY (سري — على الخادم فقط)
 *   - VAPID_SUBJECT (عنوان contact: "mailto:admin@baity.app" مثلاً)
 *
 * توليد المفاتيح: `npx web-push generate-vapid-keys`
 */

import webpush from 'web-push';
import { prisma } from '@/core/db';

let initialized = false;
let configured = false;

/**
 * تهيئة web-push بالـ VAPID — تُستدعى مرة واحدة (lazy).
 * @returns true إن كانت الإعدادات صحيحة
 */
function ensureInitialized(): boolean {
  if (initialized) return configured;
  initialized = true;

  const publicKey = process.env['VAPID_PUBLIC_KEY'];
  const privateKey = process.env['VAPID_PRIVATE_KEY'];
  const subject = process.env['VAPID_SUBJECT'] ?? 'mailto:noreply@baity.local';

  if (!publicKey || !privateKey) {
    console.warn('[web-push] VAPID keys not configured — push notifications disabled');
    configured = false;
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/** هل Web Push مُفعَّل في هذه البيئة؟ */
export function isWebPushEnabled(): boolean {
  return ensureInitialized();
}

export interface PushPayload {
  title: string;
  body: string;
  /** URL يُفتح عند النقر على الإشعار */
  url?: string;
  /** أيقونة (مسار static) */
  icon?: string;
  /** علامة لتجميع الإشعارات المتشابهة */
  tag?: string;
}

/**
 * يُرسل إشعار Push لمستخدم واحد عبر كل اشتراكاته.
 * يُرجع عدد الاشتراكات التي تلقّت الإشعار بنجاح.
 *
 * إن فشل اشتراك بـ 410/404 (gone) — يُحذف من DB تلقائياً.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  if (!ensureInitialized()) return 0;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscriptions.length === 0) return 0;

  const body = JSON.stringify(payload);
  let succeeded = 0;
  const expiredIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
          { TTL: 60 * 60 * 24 } // 24 hours
        );
        succeeded += 1;
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          // الاشتراك انتهى — حذف
          expiredIds.push(sub.id);
        } else {
          console.warn('[web-push] send failed:', err);
        }
      }
    })
  );

  if (expiredIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: expiredIds } },
    });
  }

  if (succeeded > 0) {
    await prisma.pushSubscription.updateMany({
      where: {
        userId,
        endpoint: { in: subscriptions.map((s) => s.endpoint) },
      },
      data: { lastUsedAt: new Date() },
    });
  }

  return succeeded;
}

/**
 * يُرسل إشعار لكل أعضاء المنزل (الأطباع غير المفعّلين يُتجاهَلون بصمت).
 */
export async function sendPushToHousehold(
  householdId: string,
  payload: PushPayload
): Promise<number> {
  if (!ensureInitialized()) return 0;

  const members = await prisma.householdMember.findMany({
    where: { householdId },
    select: { userId: true },
  });

  let total = 0;
  await Promise.all(
    members.map(async (m) => {
      total += await sendPushToUser(m.userId, payload);
    })
  );

  return total;
}
