/**
 * Notifications Abstraction — الإشعارات (Web → Capacitor)
 *
 * يعمل على الويب عبر Notifications API.
 * عند التغليف بـ Capacitor: @capacitor/push-notifications
 *
 * Reference: EXECUTION_PLAN_V2.md — Native Abstractions
 */

export interface LocalNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;        // لاستبدال إشعار موجود بنفس الـ tag
  data?: Record<string, unknown>;
  onClick?: () => void;
}

export type NotificationPermission = 'granted' | 'denied' | 'default';

/**
 * طلب إذن الإشعارات من المستخدم
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

/**
 * هل الإشعارات مدعومة ومُصرَّح بها؟
 */
export function canShowNotifications(): boolean {
  return typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted';
}

/**
 * عرض إشعار محلي فوري
 */
export function showLocalNotification(notification: LocalNotification): void {
  if (!canShowNotifications()) return;

  const n = new Notification(notification.title, {
    body: notification.body,
    icon: notification.icon ?? '/icons/icon-192.png',
    badge: notification.badge ?? '/icons/badge-72.png',
    tag: notification.tag,
    data: notification.data,
    dir: 'rtl',
    lang: 'ar',
  });

  if (notification.onClick) {
    n.onclick = () => {
      window.focus();
      notification.onClick!();
      n.close();
    };
  }
}

/**
 * جدولة إشعار بعد تأخير (Web — setTimeout فقط)
 * للإشعارات المجدولة الحقيقية: Service Worker أو Capacitor
 */
export function scheduleNotification(
  notification: LocalNotification,
  delayMs: number
): () => void {
  const timeoutId = setTimeout(() => {
    showLocalNotification(notification);
  }, delayMs);

  // تُرجع دالة لإلغاء الإشعار
  return () => clearTimeout(timeoutId);
}

/**
 * تسجيل Service Worker لـ Push Notifications
 * TODO: تفعيل بعد إضافة VAPID keys في .env.local
 */
export async function registerPushNotifications(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') return false;

    // TODO: اشترك في Push Service
    // const subscription = await registration.pushManager.subscribe({
    //   userVisibleOnly: true,
    //   applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    // });
    // await api.post('/notifications/subscribe', subscription);

    void registration; // suppress unused warning
    return true;
  } catch {
    return false;
  }
}
