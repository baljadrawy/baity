'use client';

/**
 * صفحة الإعداد الأولي (Onboarding)
 * تظهر بعد التسجيل الأول — تطلب اسم المنزل واسم المستخدم
 * Mobile-first
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

export default function OnboardingPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const to = useTranslations('onboarding');
  const router = useRouter();
  const locale = useLocale();

  const [householdName, setHouseholdName] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim() || !userName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdName: householdName.trim(),
          userName: userName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'unknown_error');
      }

      router.replace(`/${locale}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-3xl"
            aria-hidden="true"
          >
            🏠
          </div>
          <h1 className="text-2xl font-bold">{t('appName')}</h1>
          <p className="text-sm text-muted-foreground">{t('tagline')}</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 space-y-5"
          noValidate
        >
          <div className="space-y-2">
            <label htmlFor="household-name" className="text-sm font-medium block">
              {to('householdName')} <span className="text-red-500" aria-hidden>*</span>
            </label>
            <input
              id="household-name"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder={to('householdNamePlaceholder')}
              className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[48px]"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="user-name" className="text-sm font-medium block">
              {to('userName')} <span className="text-red-500" aria-hidden>*</span>
            </label>
            <input
              id="user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={to('userNamePlaceholder')}
              className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[48px]"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={!householdName.trim() || !userName.trim() || isLoading}
            className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? tc('loading') : to('start')}
          </button>
        </form>
      </div>
    </main>
  );
}
