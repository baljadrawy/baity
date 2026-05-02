/**
 * ThemeSwitcher — تبديل الثيم بين فاتح / داكن / نظام
 *
 * يحفظ التفضيل في localStorage تحت المفتاح `baity-theme`
 * ويُطبّق class="dark" على <html> فوراً.
 * مزامنة مع تفضيل النظام عند اختيار "system".
 */

'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'baity-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
}

export function ThemeSwitcher() {
  const t = useTranslations('settings');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
    setTheme(stored);
    // مهم: طبّق الـ theme فعلياً عند mount — وإلا يبقى الـ HTML بالـ light فقط
    applyTheme(stored);

    // متابعة تغيّر تفضيل النظام عند اختيار "system"
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
      if (current === 'system') applyTheme('system');
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const choose = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t('themeLight'), icon: <Sun className="w-4 h-4" aria-hidden /> },
    { value: 'dark', label: t('themeDark'), icon: <Moon className="w-4 h-4" aria-hidden /> },
    { value: 'system', label: t('themeSystem'), icon: <Monitor className="w-4 h-4" aria-hidden /> },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t('appearance')}
      className="flex gap-2 p-2"
    >
      {options.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(opt.value)}
            className={`flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
