/**
 * MonthlyFlowWidget — مصروفات الشهر (آخر 6 أشهر) + توزيع بالفئة
 *
 * Server Component:
 * - مصروفات حقيقية: مجموع BillPayment.amount لكل شهر
 * - أعلى 3 فئات إنفاق خلال 90 يوم
 * - اتجاه شهر مقابل الذي قبله (٪)
 *
 * لا يعرض دخلاً (التطبيق ما يتتبع الدخل).
 */

import { getTranslations, getLocale } from 'next-intl/server';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { prisma } from '@/core/db';
import { getServerSession } from '@/core/auth/server-session';
import { formatCurrency, formatPercent } from '@/core/i18n/format-number';
import type { Locale } from '@/i18n/config';
import { MonthlyFlowChart } from '@/shared/ui/MonthlyFlowChart';
import { TrendPill } from '@/shared/ui/TrendPill';

const MONTH_LABELS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const MONTH_LABELS_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type BillCategory =
  | 'ELECTRICITY' | 'WATER' | 'TELECOM' | 'INTERNET'
  | 'SUBSCRIPTION' | 'RENT' | 'INSURANCE' | 'OTHER';

const CATEGORY_KEY: Record<BillCategory, string> = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  TELECOM: 'telecom',
  INTERNET: 'internet',
  SUBSCRIPTION: 'subscription',
  RENT: 'rent',
  INSURANCE: 'insurance',
  OTHER: 'other',
};

export async function MonthlyFlowWidget() {
  const t = await getTranslations('dashboard');
  const tCat = await getTranslations('bills.categories');
  const locale = (await getLocale()) as Locale;
  const session = await getServerSession();
  if (!session) return null;

  // آخر 6 أشهر
  const now = new Date();
  const labels = locale === 'ar' ? MONTH_LABELS_AR : MONTH_LABELS_EN;
  const months: { start: Date; end: Date; label: string }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      label: labels[d.getMonth()] ?? '',
    });
  }

  // مصروفات شهرية + توزيع بالفئة لآخر 90 يوم
  const since90Days = new Date(now.getTime() - 90 * 86400000);

  const [monthlyExpenses, recentPayments] = await Promise.all([
    Promise.all(
      months.map(async ({ start, end }) => {
        const payments = await prisma.billPayment.findMany({
          where: {
            paidAt: { gte: start, lt: end },
            bill: { householdId: session.householdId, deletedAt: null },
          },
          select: { amount: true },
        });
        return payments.reduce((sum, p) => sum + Number(p.amount), 0);
      })
    ),
    prisma.billPayment.findMany({
      where: {
        paidAt: { gte: since90Days },
        bill: { householdId: session.householdId, deletedAt: null },
      },
      select: { amount: true, bill: { select: { category: true } } },
    }),
  ]);

  const data = months.map((m, i) => ({
    label: m.label,
    expenses: Math.round(monthlyExpenses[i] ?? 0),
  }));

  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
  const lastMonth = data[data.length - 2];
  const thisMonth = data[data.length - 1];

  const change =
    lastMonth && thisMonth && lastMonth.expenses > 0
      ? (thisMonth.expenses - lastMonth.expenses) / lastMonth.expenses
      : 0;
  const absPct = Math.abs(change);
  const direction: 'up' | 'down' | 'flat' =
    absPct < 0.02 ? 'flat' : change > 0 ? 'up' : 'down';

  const insightLine =
    direction === 'up'
      ? t('insights.expensesUp', { percent: formatPercent(absPct, locale) })
      : direction === 'down'
        ? t('insights.expensesDown', { percent: formatPercent(absPct, locale) })
        : t('insights.expensesFlat');

  // توزيع آخر 90 يوم بالفئة
  const byCategory = new Map<string, number>();
  for (const p of recentPayments) {
    const cat = p.bill.category as BillCategory;
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + Number(p.amount));
  }
  const totalRecent = Array.from(byCategory.values()).reduce((s, v) => s + v, 0);
  const topCategories = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amount]) => ({
      key: CATEGORY_KEY[cat as BillCategory] ?? 'other',
      amount,
      percent: totalRecent > 0 ? amount / totalRecent : 0,
    }));

  return (
    <div className="flex flex-col gap-4">
      {/* Header — totals + trend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-xs text-muted-foreground">{t('insights.totalExpenses6m')}</p>
          <p
            className="text-xl md:text-2xl font-bold text-foreground tabular-nums"
            dir="ltr"
            style={{ fontFeatureSettings: '"lnum", "tnum"' }}
          >
            {formatCurrency(totalExpenses, locale)}
          </p>
        </div>
        {direction !== 'flat' && (
          <TrendPill
            direction={direction}
            label={formatPercent(absPct, locale)}
            positiveWhen="down"
            ariaLabel={insightLine}
          />
        )}
      </div>

      {/* الرسم */}
      <div className="-mx-1">
        <MonthlyFlowChart
          data={data}
          height={200}
          ariaLabel={`${t('insights.monthlyExpenses')} — ${insightLine}`}
        />
      </div>

      {/* أعلى الفئات */}
      {topCategories.length > 0 && (
        <div className="flex flex-col gap-2 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground">
            {t('insights.topCategoriesTitle')}
          </p>
          <ul className="flex flex-col gap-1.5" role="list">
            {topCategories.map((c) => (
              <li key={c.key} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-foreground">
                  {tCat(c.key as 'electricity')}
                </span>
                <div className="flex-shrink-0 w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.round(c.percent * 100)}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(c.percent * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span
                  className="flex-shrink-0 text-foreground font-medium tabular-nums w-24 text-end"
                  dir="ltr"
                  style={{ fontFeatureSettings: '"lnum", "tnum"' }}
                >
                  {formatCurrency(c.amount, locale)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">{insightLine}</p>

      <SummaryFooter
        thisMonth={thisMonth?.expenses ?? 0}
        lastMonth={lastMonth?.expenses ?? 0}
        locale={locale}
        t={t}
      />
    </div>
  );
}

function SummaryFooter({
  thisMonth,
  lastMonth,
  locale,
  t,
}: {
  thisMonth: number;
  lastMonth: number;
  locale: Locale;
  t: (k: string) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <SummaryCell
        label={t('thisMonth')}
        value={formatCurrency(thisMonth, locale)}
        tone={thisMonth > lastMonth ? 'error' : 'success'}
      />
      <SummaryCell
        label={t('lastMonth')}
        value={formatCurrency(lastMonth, locale)}
        tone="default"
      />
    </div>
  );
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'error' | 'default';
}) {
  const Icon =
    tone === 'success' ? TrendingDown : tone === 'error' ? TrendingUp : TrendingDown;
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'error'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <div className="flex flex-col gap-0.5 min-w-0 rounded-xl bg-muted/30 p-2.5">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {tone !== 'default' && <Icon size={12} className={toneClass} aria-hidden="true" />}
        <span className="truncate">{label}</span>
      </div>
      <p
        className="text-sm md:text-base font-bold text-foreground tabular-nums truncate"
        dir="ltr"
        style={{ fontFeatureSettings: '"lnum", "tnum"' }}
      >
        {value}
      </p>
    </div>
  );
}
