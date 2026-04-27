/**
 * صفحة تسجيل الدخول — OTP عبر رقم الجوال
 * Mobile-first، كل النصوص من i18n، لا أرقام هندية
 */

import { useTranslations } from 'next-intl';
import { LoginForm } from './_components/LoginForm';

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-3xl"
            aria-hidden="true"
          >
            🏠
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('appName')}</h1>
          <p className="text-sm text-muted-foreground">{t('loginSubtitle')}</p>
        </div>

        {/* نموذج الدخول */}
        <LoginForm />
      </div>
    </main>
  );
}
