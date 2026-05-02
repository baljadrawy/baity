'use client';

/**
 * صفحة الإعدادات
 * Mobile-first، كل النصوص من i18n
 */

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  ExternalLink,
  Send,
  Bell,
  Globe,
  Info,
  Users,
  Home,
  Palette,
  ChevronLeft,
  LogOut,
  Loader2,
} from 'lucide-react';
import { ThemeSwitcher } from '@/shared/components/ThemeSwitcher';
import { PushNotificationsToggle } from '@/shared/components/PushNotificationsToggle';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tNav = useTranslations('navigation');
  const tc = useTranslations('common');
  const locale = useLocale();

  const telegramBotUsername = process.env['NEXT_PUBLIC_TELEGRAM_BOT_USERNAME'] ?? 'BaityHouseBot';
  const [loggingOut, setLoggingOut] = useState(false);

  const handleTelegramLink = () => {
    window.open(`https://t.me/${telegramBotUsername}?start=link`, '_blank', 'noopener');
  };

  const handleLogout = async () => {
    if (!window.confirm(t('logoutConfirm'))) return;
    setLoggingOut(true);
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* تجاهل — سنُعيد التوجيه على أي حال */
    }
    window.location.href = `/${locale}`;
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-20">
      <h1 className="text-xl font-bold">{t('title')}</h1>

      {/* المنزل */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Home className="w-4 h-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold text-muted-foreground">{t('household')}</span>
        </div>
        <Link
          href={`/${locale}/settings/members`}
          className="w-full flex items-center gap-3 px-4 min-h-[56px] hover:bg-muted/50 transition-colors text-start"
        >
          <Users className="w-5 h-5 text-muted-foreground flex-shrink-0" aria-hidden />
          <span className="flex-1 text-sm font-medium">{t('members')}</span>
          <ChevronLeft className="w-4 h-4 text-muted-foreground rtl:rotate-180" aria-hidden />
        </Link>
      </section>

      {/* الإشعارات */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Bell className="w-4 h-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold text-muted-foreground">{t('notifications')}</span>
        </div>

        {/* ربط تيليغرام */}
        <button
          onClick={handleTelegramLink}
          className="w-full flex items-center gap-3 px-4 min-h-[56px] hover:bg-muted/50 transition-colors border-b border-border"
        >
          <Send className="w-5 h-5 text-[#229ED9] flex-shrink-0" aria-hidden />
          <div className="flex-1 text-start">
            <p className="text-sm font-medium">{t('telegram')}</p>
            <p className="text-xs text-muted-foreground">@{telegramBotUsername}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
        </button>

        {/* تفعيل إشعارات المتصفح */}
        <PushNotificationsToggle />
      </section>

      {/* اللغة */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Globe className="w-4 h-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold text-muted-foreground">{t('language')}</span>
        </div>
        <SettingsRow icon={<Globe className="w-5 h-5" />} label={t('languageArabic')} value="AR" />
      </section>

      {/* المظهر */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Palette className="w-4 h-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold text-muted-foreground">{t('appearance')}</span>
        </div>
        <ThemeSwitcher />
      </section>

      {/* عن التطبيق */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Info className="w-4 h-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold text-muted-foreground">{t('about')}</span>
        </div>
        <SettingsRow
          icon={<Info className="w-5 h-5" />}
          label={tNav('appName')}
          value="MVP v1.0"
        />
      </section>

      {/* تسجيل الخروج */}
      <section className="bg-card border border-destructive/30 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 min-h-[56px] text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
          aria-label={t('logout')}
        >
          {loggingOut ? (
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" aria-hidden />
          ) : (
            <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden />
          )}
          <span className="flex-1 text-sm font-semibold text-start">
            {loggingOut ? tc('loading') : t('logout')}
          </span>
        </button>
      </section>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 min-h-[56px] hover:bg-muted/50 transition-colors text-start"
    >
      <span className="text-muted-foreground flex-shrink-0">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
    </button>
  );
}
