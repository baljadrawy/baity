/**
 * إعدادات التدويل (i18n) — "بيتي"
 * المرجع: EXECUTION_PLAN_V2.md — قسم i18n
 */

export const locales = ['ar', 'en'] as const;
export const defaultLocale = 'ar' as const;

export type Locale = (typeof locales)[number];

export const localeConfig = {
  ar: {
    name: 'العربية',
    dir: 'rtl' as const,
    flag: '🇸🇦',
    /**
     * lang attribute في HTML — يجبر الأرقام العربية الأصلية (0-9)
     * عبر Unicode extension: -u-nu-latn
     * بدون هذا، Safari/iOS قد يعرض الأرقام الهندية تلقائياً
     */
    htmlLang: 'ar-SA-u-nu-latn',
    /** النظام الرقمي: latn = الأرقام العربية الأصلية 0-9 */
    numberingSystem: 'latn' as const,
    fontFamily: '"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui',
    /** ممنوع منعاً باتاً استخدام الأرقام الهندية ٠-٩ أو الفارسية ۰-۹ */
    forbidIndicDigits: true,
  },
  en: {
    name: 'English',
    dir: 'ltr' as const,
    flag: '🇬🇧',
    htmlLang: 'en-US',
    numberingSystem: 'latn' as const,
    fontFamily: '"Inter", system-ui',
    forbidIndicDigits: true,
  },
} as const satisfies Record<
  Locale,
  {
    name: string;
    dir: 'rtl' | 'ltr';
    flag: string;
    htmlLang: string;
    numberingSystem: 'latn';
    fontFamily: string;
    forbidIndicDigits: boolean;
  }
>;
