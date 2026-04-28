/**
 * PhoneStep — خطوة إدخال رقم الجوال
 * Mobile-first، لا نصوص حرفية في JSX
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { convertToWesternDigits } from '@/core/i18n/format-number';

interface PhoneStepProps {
  onSubmit: (phone: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  /** اسم البوت — يُملأ عند خطأ not_linked ليُعرض زر فتح البوت */
  botUsername?: string | null;
}

export function PhoneStep({ onSubmit, isLoading, error, botUsername }: PhoneStepProps) {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // تحويل الأرقام الهندية/الفارسية تلقائياً عند الإدخال
    const converted = convertToWesternDigits(e.target.value).replace(/\D/g, '');
    setValue(converted.slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length === 10) {
      await onSubmit(value);
    }
  };

  const isValid = /^05\d{8}$/.test(value);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="phone"
          className="text-sm font-medium text-foreground"
        >
          {t('phoneLabel')}
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          autoFocus
          dir="ltr"
          value={value}
          onChange={handleChange}
          placeholder={t('phonePlaceholder')}
          className={[
            'min-h-[52px] w-full rounded-xl border bg-background px-4 py-3',
            'text-lg tracking-widest text-center font-mono',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            'transition-colors',
            error ? 'border-destructive' : 'border-border',
          ].join(' ')}
        />
        {error && error !== 'not_linked' && (
          <p className="text-sm text-destructive" role="alert">
            {tErrors(error as Parameters<typeof tErrors>[0]) ?? error}
          </p>
        )}
        <p className="text-xs text-muted-foreground text-center">
          {t('phoneHint')}
        </p>
      </div>

      {/* بطاقة الربط مع Telegram عند الحاجة */}
      {botUsername && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3">
          <h3 className="font-semibold text-sm">{t('linkTelegramTitle')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('linkTelegramDesc')}</p>
          <a
            href={`https://t.me/${botUsername}?start=link`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-4"
          >
            {t('openBot')}
          </a>
          <p className="text-xs text-muted-foreground text-center">{t('afterLink')}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className={[
          'min-h-[52px] w-full rounded-xl font-semibold text-base',
          'bg-primary text-primary-foreground',
          'transition-opacity disabled:opacity-50',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        ].join(' ')}
      >
        {isLoading ? t('sending') : t('sendOtp')}
      </button>
    </form>
  );
}
