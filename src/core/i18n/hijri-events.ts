/**
 * Hijri Events — مناسبات سعودية/إسلامية ثابتة بالتقويم الهجري
 *
 * المناسبات الهجرية الثابتة (متعارَف عليها — قد تتغيّر بـ يوم بناءً على الرؤية):
 *  - 1 محرم: رأس السنة الهجرية
 *  - 10 محرم: عاشوراء
 *  - 12 ربيع الأول: المولد النبوي
 *  - 27 رجب: الإسراء والمعراج
 *  - 15 شعبان: ليلة النصف من شعبان
 *  - 1-30 رمضان: رمضان (شهر كامل)
 *  - 27 رمضان: ليلة القدر (تقريبية — أوتار العشر الأواخر)
 *  - 1-3 شوال: عيد الفطر
 *  - 9 ذو الحجة: يوم عرفة
 *  - 10-13 ذو الحجة: عيد الأضحى
 *
 * المناسبات الميلادية الثابتة (سعودية):
 *  - 23 سبتمبر: اليوم الوطني السعودي
 *  - 22 فبراير: يوم التأسيس
 *  - 11 يونيو: يوم العلم
 */

export type HijriEventCategory = 'religious' | 'national' | 'personal';

export interface HijriEvent {
  /** مفتاح i18n للاسم */
  key: string;
  category: HijriEventCategory;
  /** للمناسبات الهجرية */
  hijri?: { month: number; day: number; durationDays?: number };
  /** للمناسبات الميلادية */
  gregorian?: { month: number; day: number };
  emoji: string;
}

export const HIJRI_EVENTS: HijriEvent[] = [
  { key: 'newHijriYear', category: 'religious', hijri: { month: 1, day: 1 }, emoji: '🌙' },
  { key: 'ashura', category: 'religious', hijri: { month: 1, day: 10 }, emoji: '🤲' },
  { key: 'mawlid', category: 'religious', hijri: { month: 3, day: 12 }, emoji: '🕌' },
  { key: 'isra', category: 'religious', hijri: { month: 7, day: 27 }, emoji: '✨' },
  { key: 'midShaban', category: 'religious', hijri: { month: 8, day: 15 }, emoji: '🌟' },
  { key: 'ramadanStart', category: 'religious', hijri: { month: 9, day: 1, durationDays: 30 }, emoji: '🌙' },
  { key: 'laylatAlQadr', category: 'religious', hijri: { month: 9, day: 27 }, emoji: '🌟' },
  { key: 'eidFitr', category: 'religious', hijri: { month: 10, day: 1, durationDays: 3 }, emoji: '🎉' },
  { key: 'arafah', category: 'religious', hijri: { month: 12, day: 9 }, emoji: '⛰️' },
  { key: 'eidAdha', category: 'religious', hijri: { month: 12, day: 10, durationDays: 4 }, emoji: '🐑' },
  // سعودية
  { key: 'foundingDay', category: 'national', gregorian: { month: 2, day: 22 }, emoji: '🇸🇦' },
  { key: 'flagDay', category: 'national', gregorian: { month: 6, day: 11 }, emoji: '🇸🇦' },
  { key: 'nationalDay', category: 'national', gregorian: { month: 9, day: 23 }, emoji: '🇸🇦' },
];

/**
 * يبحث عن المناسبة الأقرب من اليوم الحالي (خلال نافذة `windowDays` يوم).
 * يُرجع اليوم الجاري أولاً إن كان مناسبة، ثم القادم خلال النافذة.
 *
 * `currentHijri` و `currentGregorian` يمرَّان من الـ caller (server-time).
 */
export interface UpcomingEventResult {
  event: HijriEvent;
  /** عدد الأيام للحدث (0 = اليوم، موجب = قادم) */
  daysAway: number;
  /** هل الحدث جارٍ الآن (لمدة عدة أيام)؟ */
  isOngoing: boolean;
}

export function findUpcomingEvents(
  todayGregorian: Date,
  todayHijri: { day: number; month: number; year: number },
  windowDays = 30
): UpcomingEventResult[] {
  const results: UpcomingEventResult[] = [];
  const todayMs = todayGregorian.getTime();

  for (const event of HIJRI_EVENTS) {
    const occurrence = nextOccurrence(event, todayGregorian, todayHijri);
    if (!occurrence) continue;

    const daysAway = Math.round((occurrence.date.getTime() - todayMs) / 86400000);
    const duration = event.hijri?.durationDays ?? 1;
    const endDay = daysAway + duration - 1;
    const isOngoing = daysAway <= 0 && endDay >= 0;

    if (daysAway >= -duration + 1 && daysAway <= windowDays) {
      results.push({ event, daysAway: Math.max(0, daysAway), isOngoing });
    }
  }

  // الحدث الجاري أولاً، ثم الأقرب
  results.sort((a, b) => {
    if (a.isOngoing !== b.isOngoing) return a.isOngoing ? -1 : 1;
    return a.daysAway - b.daysAway;
  });

  return results;
}

/**
 * يحسب التاريخ الميلادي للحدث القادم.
 * - مناسبات هجرية: نقارب — نضيف فرق الأيام بين الـ hijri اليوم والمناسبة
 * - مناسبات ميلادية: نستخدم سنة todayGregorian أو السنة القادمة
 */
function nextOccurrence(
  event: HijriEvent,
  todayGregorian: Date,
  todayHijri: { day: number; month: number; year: number }
): { date: Date } | null {
  if (event.gregorian) {
    const { month, day } = event.gregorian;
    let date = new Date(todayGregorian.getFullYear(), month - 1, day);
    if (date.getTime() < startOfDay(todayGregorian).getTime() - 86400000) {
      date = new Date(todayGregorian.getFullYear() + 1, month - 1, day);
    }
    return { date };
  }

  if (event.hijri) {
    const target = event.hijri;
    const todayHijriDays = todayHijri.year * 354 + todayHijri.month * 29.53 + todayHijri.day;
    let targetYear = todayHijri.year;
    let targetHijriDays = targetYear * 354 + target.month * 29.53 + target.day;
    if (targetHijriDays < todayHijriDays - 1) {
      targetYear += 1;
      targetHijriDays = targetYear * 354 + target.month * 29.53 + target.day;
    }
    const offsetDays = Math.round(targetHijriDays - todayHijriDays);
    const date = new Date(todayGregorian.getTime() + offsetDays * 86400000);
    return { date };
  }

  return null;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
