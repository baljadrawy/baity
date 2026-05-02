/**
 * HijriCalendarWidget — عرض التاريخ الهجري + المناسبات القادمة
 * Server Component — لا يحتاج تفاعل
 */

import { getTranslations, getLocale } from 'next-intl/server';
import { findUpcomingEvents } from '@/core/i18n/hijri-events';

/**
 * تحويل التاريخ الميلادي إلى هجري
 * خوارزمية مبسّطة دقيقة لأغراض العرض (لا تحتاج مكتبة خارجية)
 * Reference: https://www.islamicfinder.org/islamic-date-converter/
 */
function gregorianToHijri(date: Date): { day: number; month: number; year: number } {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  let jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4)
    + Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12)
    - Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4)
    + gd - 32075;

  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719)
    + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return { day, month, year };
}

/** أسماء أيام الأسبوع بالعربية */
const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export async function HijriCalendarWidget() {
  const t = await getTranslations('hijri');
  const locale = await getLocale();

  const now = new Date();
  const hijri = gregorianToHijri(now);
  const weekday = WEEKDAYS_AR[now.getDay()];

  // أسماء الأشهر الهجرية من ملف الترجمة
  const monthName = t(`months.${hijri.month}` as Parameters<typeof t>[0]);

  // التاريخ الميلادي
  const gregorianFormatted = now.toLocaleDateString(
    locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <section
      aria-label={t('title')}
      className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-1"
    >
      {/* اليوم */}
      <p className="text-xs text-muted-foreground">{weekday}</p>

      {/* التاريخ الهجري */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {hijri.day}
        </span>
        <span className="text-lg font-semibold text-foreground">
          {monthName}
        </span>
        <span className="text-base text-muted-foreground tabular-nums">
          {hijri.year}
          {' '}
          {t('title').includes('هج') ? '' : 'هـ'}
        </span>
      </div>

      {/* الفاصل */}
      <div className="h-px bg-border my-1" />

      {/* التاريخ الميلادي */}
      <p className="text-sm text-muted-foreground">{gregorianFormatted}</p>

      <UpcomingEvents now={now} hijri={hijri} />
    </section>
  );
}

async function UpcomingEvents({
  now,
  hijri,
}: {
  now: Date;
  hijri: { day: number; month: number; year: number };
}) {
  const tEvents = await getTranslations('hijri.events');
  const upcoming = findUpcomingEvents(now, hijri, 30).slice(0, 2);
  if (upcoming.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-border" role="list">
      {upcoming.map(({ event, daysAway, isOngoing }) => (
        <li
          key={event.key}
          className="flex items-center gap-2 text-xs"
        >
          <span aria-hidden="true" className="text-base">
            {event.emoji}
          </span>
          <span className="flex-1 text-foreground font-medium truncate">
            {tEvents(event.key as 'newHijriYear')}
          </span>
          <span
            className="trend-pill bg-primary/10 text-primary tabular-nums"
            dir="ltr"
            style={{ fontFeatureSettings: '"lnum", "tnum"' }}
          >
            {isOngoing
              ? tEvents('ongoing')
              : daysAway === 0
                ? tEvents('today')
                : tEvents('inDays', { days: daysAway })}
          </span>
        </li>
      ))}
    </ul>
  );
}
