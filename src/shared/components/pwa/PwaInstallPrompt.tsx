/**
 * PwaInstallPrompt — شريط تثبيت PWA
 * يظهر مرة واحدة فقط عند توفر حدث beforeinstallprompt
 * Client Component — يتعامل مع browser event
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa_prompt_dismissed';

export function PwaInstallPrompt() {
  const t = useTranslations('pwa');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // إذا رفض المستخدم من قبل، لا تُظهر المطالبة
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-20 lg:bottom-6 start-4 end-4 lg:start-auto lg:end-6 lg:w-80
                 z-50 rounded-2xl border border-border bg-card shadow-lg
                 flex items-center gap-3 p-4 animate-in slide-in-from-bottom-4"
    >
      {/* أيقونة التطبيق */}
      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center
                    rounded-xl bg-primary text-primary-foreground text-2xl"
        aria-hidden="true"
      >
        🏠
      </div>

      {/* النص */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-snug">
          {t('installTitle')}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {t('installDesc')}
        </p>
      </div>

      {/* أزرار */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold
                     text-primary-foreground hover:bg-primary/90 transition-colors
                     min-h-[32px]"
        >
          {t('install')}
        </button>
        <button
          onClick={handleDismiss}
          aria-label={t('later')}
          className="flex items-center justify-center rounded-lg p-1.5
                     text-muted-foreground hover:text-foreground hover:bg-accent
                     transition-colors min-h-[32px]"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
