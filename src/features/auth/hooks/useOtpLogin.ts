/**
 * useOtpLogin — منطق تسجيل الدخول عبر OTP
 *
 * المراحل:
 * 1. PHONE — إدخال رقم الجوال وإرسال OTP
 * 2. OTP — إدخال الرمز المستلم
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

type Step = 'phone' | 'otp';

interface UseOtpLoginReturn {
  step: Step;
  phone: string;
  isLoading: boolean;
  error: string | null;
  /** اسم البوت عند الحاجة لربط Telegram (when error === 'not_linked') */
  botUsername: string | null;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  goBack: () => void;
}

export function useOtpLogin(): UseOtpLoginReturn {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();

  const sendOtp = async (rawPhone: string) => {
    setIsLoading(true);
    setError(null);
    setBotUsername(null);
    try {
      const res = await fetch('/api/v1/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string; botUsername?: string };
        if (data.error === 'not_linked' && data.botUsername) {
          setBotUsername(data.botUsername);
        }
        throw new Error(data.error ?? 'otp_send_failed');
      }

      setPhone(rawPhone);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json() as {
        needsOnboarding?: boolean;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? 'otp_invalid');
      }

      if (data.needsOnboarding) {
        router.push(`/${locale}/onboarding`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown_error');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setStep('phone');
    setError(null);
  };

  return { step, phone, isLoading, error, botUsername, sendOtp, verifyOtp, goBack };
}
