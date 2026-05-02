/**
 * AppHeader — الرأس الثابت
 * Mobile-first، يظهر على كل الأجهزة
 * - جوال/تابلت: يحمل اللوغو + إشعارات
 * - ديسكتوب: يحمل breadcrumb + معلومات المستخدم
 */

'use client';

import Link from 'next/link';
import { Bell, Settings } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { LocaleSwitcher } from '@/shared/components/LocaleSwitcher';

interface AppHeaderProps {
  title?: string;
  /** عدد الإشعارات غير المقروءة (اختياري) */
  notificationsCount?: number;
}

export function AppHeader({ title, notificationsCount = 0 }: AppHeaderProps) {
  const t = useTranslations('navigation');
  const tDash = useTranslations('dashboard.header');
  const locale = useLocale();

  const hasNotifications = notificationsCount > 0;
  const badgeLabel =
    notificationsCount > 9
      ? '9+'
      : new Intl.NumberFormat('ar-SA-u-nu-latn').format(notificationsCount);

  return (
    <header
      className="sticky top-0 z-30 flex items-center bg-card/80 backdrop-blur border-b border-border px-4 lg:px-6"
      style={{ height: 'var(--header-height)' }}
    >
      {/* اللوغو — يظهر فقط على الجوال/التابلت */}
      <Link
        href={`/${locale}/dashboard`}
        className="flex items-center gap-2 lg:hidden min-h-[44px]"
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm flex-shrink-0"
          aria-hidden="true"
        >
          🏠
        </div>
        <span className="text-base font-bold text-foreground">
          {title ?? t('appName')}
        </span>
      </Link>

      {/* العنوان — يظهر فقط على الديسكتوب */}
      {title && (
        <h1 className="hidden lg:block text-lg font-semibold text-foreground">
          {title}
        </h1>
      )}

      {/* المسافة الفارغة */}
      <div className="flex-1" />

      {/* إجراءات الرأس */}
      <div className="flex items-center gap-1">
        {/* مفتاح تبديل اللغة */}
        <LocaleSwitcher />

        {/* زر الإشعارات + badge */}
        <button
          type="button"
          className="relative flex items-center justify-center rounded-xl min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-accent transition-smooth"
          aria-label={
            hasNotifications
              ? tDash('notificationsCount', { count: notificationsCount })
              : t('notifications')
          }
        >
          <Bell size={20} aria-hidden="true" />
          {hasNotifications && (
            <span
              className="absolute top-2 end-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground tabular-nums"
              dir="ltr"
              aria-hidden="true"
            >
              {badgeLabel}
            </span>
          )}
        </button>

        {/* رابط الإعدادات — للجوال (الديسكتوب يستخدم الـ Sidebar) */}
        <Link
          href={`/${locale}/settings`}
          className="flex items-center justify-center rounded-xl min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-accent transition-smooth lg:hidden"
          aria-label={t('settings')}
        >
          <Settings size={20} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
