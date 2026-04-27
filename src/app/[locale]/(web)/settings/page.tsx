'use client';

/**
 * صفحة الإعدادات
 * Mobile-first، كل النصوص من i18n
 */

import { useTranslations } from 'next-intl';
import { ExternalLink, Send, Bell, Globe, Info, Users, Home } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tNav = useTranslations('navigation');

  const telegramBotUsername = process.env['NEXT_PUBLIC_TELEGRAM_BOT_USERNAME'] ?? 'BaityHouseBot';

  const handleTelegramLink = () => {
    window.open(`https://t.me/${telegramBotUsername}?start=link`, '_blank', 'noopener');
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
        <SettingsRow icon={<Users className="w-5 h-5" />} label={t('members')} />
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
          className="w-full flex items-center gap-3 px-4 min-h-[56px] hover:bg-muted/50 transition-colors"
        >
          <Send className="w-5 h-5 text-[#229ED9] flex-shrink-0" aria-hidden />
          <div className="flex-1 text-start">
            <p className="text-sm font-medium">{t('telegram')}</p>
            <p className="text-xs text-muted-foreground">@{telegramBotUsername}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden />
        </button>
      </section>

      {/* اللغة */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Globe className="w-4 h-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold text-muted-foreground">{t('language')}</span>
        </div>
        <SettingsRow icon={<Globe className="w-5 h-5" />} label={t('languageArabic')} value="AR" />
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
