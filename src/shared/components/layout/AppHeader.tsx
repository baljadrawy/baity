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

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const t = useTranslations('navigation');
  const locale = useLocale();

  return (
    <header
      className="sticky top-0 z-30 flex items-center bg-card border-b border-border px-4 lg:px-6"
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
        {/* زر الإشعارات */}
        <button
          className="relative flex items-center justify-center rounded-xl min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={t('notifications')}
        >
          <Bell size={20} aria-hidden="true" />
        </button>

        {/* رابط الإعدادات — للجوال (الديسكتوب يستخدم الـ Sidebar) */}
        <Link
          href={`/${locale}/settings`}
          className="flex items-center justify-center rounded-xl min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors lg:hidden"
          aria-label={t('settings')}
        >
          <Settings size={20} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
