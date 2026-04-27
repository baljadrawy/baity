import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // التحقق من صحة الـ locale
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    // إعدادات الأرقام والتواريخ الافتراضية
    formats: {
      number: {
        currency: {
          style: 'currency',
          currency: 'SAR',
          currencyDisplay: 'symbol',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
        percent: {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        },
      },
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          weekday: 'long',
        },
      },
    },
    // اتجاه النص
    timeZone: 'Asia/Riyadh',
  };
});
