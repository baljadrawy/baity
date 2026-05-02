'use client';

/**
 * PushNotificationsToggle — زر تفعيل/إيقاف الإشعارات في صفحة الإعدادات
 *
 * الحالات:
 * - unsupported: لا يظهر الزر
 * - unconfigured: زر معطّل + tooltip "غير مفعّل من الخادم"
 * - denied: زر معطّل + رسالة "تم رفضه من إعدادات المتصفح"
 * - unsubscribed: زر "تفعيل" أزرق
 * - subscribed: زر "إلغاء" مع شارة "مفعّل"
 */

import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePushNotifications } from '@/shared/hooks/usePushNotifications';

export function PushNotificationsToggle() {
  const t = useTranslations('settings.push');
  const { status, subscribe, unsubscribe } = usePushNotifications();

  if (status === 'unsupported') return null;

  const isLoading = status === 'loading';
  const isSubscribed = status === 'subscribed';
  const isDisabled =
    status === 'unconfigured' || status === 'denied' || isLoading;

  const Icon = isLoading
    ? Loader2
    : isSubscribed
      ? BellRing
      : status === 'denied'
        ? BellOff
        : Bell;

  const label = isLoading
    ? t('loading')
    : isSubscribed
      ? t('enabled')
      : status === 'denied'
        ? t('denied')
        : status === 'unconfigured'
          ? t('unconfigured')
          : t('subscribe');

  const sub = isLoading
    ? undefined
    : isSubscribed
      ? t('subscribedDesc')
      : status === 'denied'
        ? t('deniedDesc')
        : status === 'unconfigured'
          ? t('unconfiguredDesc')
          : t('subscribeDesc');

  const onClick = isSubscribed ? unsubscribe : subscribe;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className="w-full flex items-center gap-3 px-4 min-h-[56px] hover:bg-muted/50 transition-colors text-start disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label={label}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 ${
          isSubscribed
            ? 'text-success'
            : status === 'denied'
              ? 'text-destructive'
              : 'text-muted-foreground'
        } ${isLoading ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}
