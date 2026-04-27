/**
 * LoginForm — Client Component يدير حالة خطوات تسجيل الدخول
 * PhoneStep → OtpStep
 */

'use client';

import { useOtpLogin } from '@/features/auth/hooks/useOtpLogin';
import { PhoneStep } from '@/features/auth/components/PhoneStep';
import { OtpStep } from '@/features/auth/components/OtpStep';

export function LoginForm() {
  const { step, phone, isLoading, error, sendOtp, verifyOtp, goBack } = useOtpLogin();

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      {step === 'phone' ? (
        <PhoneStep onSubmit={sendOtp} isLoading={isLoading} error={error} />
      ) : (
        <OtpStep
          phone={phone}
          onSubmit={verifyOtp}
          onBack={goBack}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
}
