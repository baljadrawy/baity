/**
 * LocaleSwitcher — مفتاح تبديل اللغة بين العربية والإنجليزية
 *
 * يعمل عبر إعادة توجيه الـ URL بدلاً من حالة عميل، يضمن
 * أن الـ middleware يُحدّث cookie NEXT_LOCALE تلقائياً.
 * Mobile-first: زر مع رمز الكرة الأرضية + اللغة الحالية.
 */

'use client';

import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function LocaleSwitcher() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const targetLocale = locale === 'ar' ? 'en' : 'ar';
  const targetLabel = targetLocale === 'ar' ? t('languageArabic') : t('languageEnglish');

  const switchLocale = () => {
    // استبدل الـ locale في بداية الـ path
    const newPath = pathname.replace(/^\/(ar|en)/, `/${targetLocale}`);
    startTransition(() => {
      router.push(newPath);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      disabled={pending}
      className="flex items-center gap-2 rounded-xl px-3 min-h-[44px] text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
      aria-label={t('language')}
      title={targetLabel}
    >
      <Globe size={18} aria-hidden="true" />
      <span className="hidden sm:inline">{targetLabel}</span>
    </button>
  );
}
