/**
 * OtpStep — خطوة إدخال رمز OTP
 * Mobile-first، لا نصوص حرفية في JSX
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { convertToWesternDigits } from '@/core/i18n/format-number';

interface OtpStepProps {
  phone: string;
  onSubmit: (otp: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function OtpStep({ phone, onSubmit, onBack, isLoading, error }: OtpStepProps) {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const converted = convertToWesternDigits(e.target.value).replace(/\D/g, '');
    setValue(converted.slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length >= 4) {
      await onSubmit(value);
    }
  };

  const isValid = value.length >= 4;

  // تنسيق رقم الهاتف للعرض بدون كشف الكامل
  const maskedPhone = phone.replace(/^(05\d{2})\d{4}(\d{2})$/, '$1****$2');

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <p className="text-sm text-muted-foreground text-center" dir="ltr">
        {t('otpSentTo')} <span className="font-mono font-medium text-foreground">{maskedPhone}</span>
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="otp" className="text-sm font-medium text-foreground">
          {t('otpLabel')}
        </label>
        <input
          id="otp"
          type="tel"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          dir="ltr"
          value={value}
          onChange={handleChange}
          placeholder={t('otpPlaceholder')}
          className={[
            'min-h-[52px] w-full rounded-xl border bg-background px-4 py-3',
            'text-2xl tracking-[0.5em] text-center font-mono',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            'transition-colors',
            error ? 'border-destructive' : 'border-border',
          ].join(' ')}
        />
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {tErrors(error as Parameters<typeof tErrors>[0]) ?? error}
          </p>
        )}
      </div>

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
        {isLoading ? t('verifying') : t('verify')}
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={isLoading}
        className="min-h-[44px] text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
      >
        {t('changePhone')}
      </button>
    </form>
  );
}
