/**
 * صفحة الرئيسية (Dashboard) — التصميم المُحدَّث
 * Server Component — كل الـ data fetching على الخادم
 *
 * Layout:
 * 1. Hero (greeting + date)
 * 2. Quick Actions
 * 3. KPI Row (4 cards)
 * 4. AI Summary
 * 5. Monthly Flow + Alerts (grid 2/1)
 * 6. Activity Feed + Detail Widgets (grid 1/1)
 *
 * كل النصوص عبر next-intl. كل الأرقام عبر format-number.
 * Mobile-first؛ يتدرّج إلى desktop في 4 أعمدة.
 */

import { Suspense } from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import {
  Receipt,
  ClipboardList,
  ShoppingCart,
  Tv2,
  Wallet as WalletIcon,
  ListTodo,
  Bell as BellIcon,
} from 'lucide-react';
import { prisma } from '@/core/db';
import { getServerSession } from '@/core/auth/server-session';
import { formatCurrency, formatNumber } from '@/core/i18n/format-number';
import type { Locale } from '@/i18n/config';
import { features } from '@/core/config/features';
import { KpiCard } from '@/shared/ui/KpiCard';
import { DashboardSection } from '@/shared/ui/DashboardSection';
import { QuickActionButton } from '@/shared/ui/QuickActionButton';
import { UpcomingBillsWidget } from './_widgets/UpcomingBillsWidget';
import { PendingChoresWidget } from './_widgets/PendingChoresWidget';
import { ChildWalletWidget } from './_widgets/ChildWalletWidget';
import { ShoppingWidget } from './_widgets/ShoppingWidget';
import { HijriCalendarWidget } from './_widgets/HijriCalendarWidget';
import { MonthlyFlowWidget } from './_widgets/MonthlyFlowWidget';
import { AlertsWidget } from './_widgets/AlertsWidget';
import { RecentActivityWidget } from './_widgets/RecentActivityWidget';
import { AiSummaryWidget } from './_widgets/AiSummaryWidget';

/** Skeleton — shimmer متطور */
function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <div className="h-3 w-32 rounded skeleton-shimmer" />
      <div className="h-48 rounded-xl skeleton-shimmer" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-12 rounded-lg skeleton-shimmer" />
        <div className="h-12 rounded-lg skeleton-shimmer" />
        <div className="h-12 rounded-lg skeleton-shimmer" />
      </div>
    </div>
  );
}

/**
 * توليد sparkline تقديري ينتهي بقيمة حقيقية.
 * deterministic — لا اختلاف بين server وأي rerender.
 */
function syntheticTrend(currentValue: number, points = 7): number[] {
  if (currentValue <= 0) return Array.from({ length: points }, (_, i) => i + 1);
  const arr: number[] = [];
  for (let i = 0; i < points; i += 1) {
    const t = i / (points - 1);
    const wobble = Math.sin(i * 1.3) * 0.12;
    const trend = 0.7 + 0.3 * t;
    arr.push(Math.max(0.1, currentValue * (trend + wobble)));
  }
  arr[arr.length - 1] = currentValue;
  return arr;
}

/** اختر تحية حسب الوقت */
function pickGreetingKey(): 'greetingMorning' | 'greetingEvening' | 'greeting' {
  const h = new Date().getHours();
  if (h < 12) return 'greetingMorning';
  if (h >= 17) return 'greetingEvening';
  return 'greeting';
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  const tNav = await getTranslations('navigation');
  const locale = (await getLocale()) as Locale;

  const session = await getServerSession();

  // === KPIs الأساسية ===
  let stats = {
    billsDueThisWeek: 0,
    overdueChores: 0,
    activeChores: 0,
    shoppingItems: 0,
    childBalance: 0,
    paidLastMonth: 0,
    paidThisMonth: 0,
  };

  if (session) {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      billsDueThisWeek,
      overdueChores,
      activeChores,
      shoppingItems,
      childWallets,
      paidThis,
      paidLast,
    ] = await Promise.all([
      prisma.bill.count({
        where: {
          householdId: session.householdId,
          deletedAt: null,
          status: { in: ['PENDING', 'DUE', 'OVERDUE'] },
          dueDate: { lte: in7Days },
        },
      }),
      prisma.chore.count({
        where: {
          householdId: session.householdId,
          deletedAt: null,
          isActive: true,
          nextDueDate: { lt: now },
        },
      }),
      prisma.chore.count({
        where: {
          householdId: session.householdId,
          deletedAt: null,
          isActive: true,
        },
      }),
      prisma.shoppingItem.count({
        where: {
          isChecked: false,
          list: { householdId: session.householdId, deletedAt: null },
        },
      }),
      prisma.childWallet.findMany({
        where: { member: { householdId: session.householdId, role: 'CHILD' } },
        select: { balance: true },
      }),
      prisma.billPayment.findMany({
        where: {
          paidAt: { gte: startThisMonth },
          bill: { householdId: session.householdId, deletedAt: null },
        },
        select: { amount: true },
      }),
      prisma.billPayment.findMany({
        where: {
          paidAt: { gte: startLastMonth, lt: startThisMonth },
          bill: { householdId: session.householdId, deletedAt: null },
        },
        select: { amount: true },
      }),
    ]);

    const totalBalance = childWallets.reduce((s, w) => s + Number(w.balance), 0);
    const paidThisMonth = paidThis.reduce((s, p) => s + Number(p.amount), 0);
    const paidLastMonth = paidLast.reduce((s, p) => s + Number(p.amount), 0);

    stats = {
      billsDueThisWeek,
      overdueChores,
      activeChores,
      shoppingItems,
      childBalance: totalBalance,
      paidThisMonth,
      paidLastMonth,
    };
  }

  // === حساب الـ trends ===
  const billsTrend =
    stats.paidLastMonth > 0
      ? (stats.paidThisMonth - stats.paidLastMonth) / stats.paidLastMonth
      : 0;
  const billsTrendDirection: 'up' | 'down' | 'flat' =
    Math.abs(billsTrend) < 0.02 ? 'flat' : billsTrend > 0 ? 'up' : 'down';

  // === الترحيب + التاريخ ===
  const greetingKey = pickGreetingKey();
  const greeting =
    session?.name
      ? t(greetingKey, { name: session.name })
      : t('greetingFallback');

  const todayStr = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  ).format(new Date());

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* === Hero — الترحيب + التاريخ === */}
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <span>{t('todayLabel')}</span>
          <span aria-hidden="true">·</span>
          <span>{todayStr}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {greeting}
        </h1>
        <p className="text-sm text-muted-foreground">{t('summary')}</p>
      </header>

      {/* === Quick Actions === */}
      <section aria-label={t('quickActions')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <QuickActionButton
            href={`/${locale}/bills?action=add`}
            label={t('quick.addBill')}
            icon={Receipt}
            tone="warning"
          />
          <QuickActionButton
            href={`/${locale}/chores?action=add`}
            label={t('quick.addChore')}
            icon={ClipboardList}
            tone="info"
          />
          <QuickActionButton
            href={`/${locale}/shopping?action=add`}
            label={t('quick.addShopping')}
            icon={ShoppingCart}
            tone="success"
          />
          <QuickActionButton
            href={`/${locale}/appliances?action=add`}
            label={t('quick.addAppliance')}
            icon={Tv2}
            tone="primary"
          />
        </div>
      </section>

      {/* === KPI Row === */}
      <section aria-label={t('statsSection')}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KpiCard
            icon={WalletIcon}
            tone="success"
            label={t('kpi.wallet')}
            value={formatCurrency(stats.childBalance, locale)}
            sub={t('kpi.walletSub')}
            sparkline={syntheticTrend(Math.max(stats.childBalance, 1))}
            href={`/${locale}/house-economy`}
            ariaLabel={`${t('kpi.wallet')}: ${formatCurrency(stats.childBalance, locale)}`}
          />
          <KpiCard
            icon={ListTodo}
            tone={stats.overdueChores > 0 ? 'error' : 'info'}
            label={t('kpi.tasks')}
            value={formatNumber(stats.activeChores, locale)}
            sub={
              stats.overdueChores > 0
                ? `${formatNumber(stats.overdueChores, locale)} ${t('overdue')}`
                : t('kpi.tasksSub')
            }
            sparkline={syntheticTrend(Math.max(stats.activeChores, 1))}
            trendDirection={stats.overdueChores > 0 ? 'up' : 'flat'}
            trendLabel={stats.overdueChores > 0 ? formatNumber(stats.overdueChores, locale) : ''}
            trendPositiveWhen="down"
            href={`/${locale}/chores`}
            ariaLabel={`${t('kpi.tasks')}: ${formatNumber(stats.activeChores, locale)}`}
          />
          <KpiCard
            icon={Receipt}
            tone="warning"
            label={t('kpi.bills')}
            value={formatNumber(stats.billsDueThisWeek, locale)}
            sub={t('kpi.billsSub')}
            sparkline={syntheticTrend(Math.max(stats.billsDueThisWeek, 1))}
            trendDirection={billsTrendDirection}
            trendLabel={
              Math.abs(billsTrend) < 0.02
                ? ''
                : `${formatNumber(Math.abs(billsTrend) * 100, locale, { maximumFractionDigits: 0 })}%`
            }
            trendPositiveWhen="down"
            href={`/${locale}/bills`}
            ariaLabel={`${t('kpi.bills')}: ${formatNumber(stats.billsDueThisWeek, locale)}`}
          />
          <KpiCard
            icon={ShoppingCart}
            tone="info"
            label={t('kpi.shopping')}
            value={formatNumber(stats.shoppingItems, locale)}
            sub={t('kpi.shoppingSub')}
            sparkline={syntheticTrend(Math.max(stats.shoppingItems, 1))}
            href={`/${locale}/shopping`}
            ariaLabel={`${t('kpi.shopping')}: ${formatNumber(stats.shoppingItems, locale)}`}
          />
        </div>
      </section>

      {/* === AI Summary === */}
      <Suspense fallback={<div className="h-32 rounded-xl skeleton-shimmer" />}>
        <AiSummaryWidget />
      </Suspense>

      {/* === التقويم الهجري (إذا مفعّل) === */}
      {features.hijriCalendar && <HijriCalendarWidget />}

      {/* === Insights + Alerts === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <DashboardSection
          title={t('insights.monthlyFlow')}
          description={t('insights.monthlyFlowDesc')}
          viewAllHref={`/${locale}/bills`}
          viewAllLabel={t('viewAll')}
          className="lg:col-span-2"
        >
          <Suspense fallback={<ChartSkeleton />}>
            <MonthlyFlowWidget />
          </Suspense>
        </DashboardSection>

        <DashboardSection
          title={t('alerts.title')}
          description={t('alerts.subtitle')}
          headerExtra={<BellIcon size={16} className="text-muted-foreground" aria-hidden="true" />}
        >
          <Suspense fallback={<SectionSkeleton rows={4} />}>
            <AlertsWidget />
          </Suspense>
        </DashboardSection>
      </div>

      {/* === Activity Feed + Detail Widgets === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <DashboardSection
          title={t('activity.title')}
          description={t('activity.subtitle')}
        >
          <Suspense fallback={<SectionSkeleton rows={5} />}>
            <RecentActivityWidget />
          </Suspense>
        </DashboardSection>

        <div className="flex flex-col gap-4 md:gap-6">
          <DashboardSection
            title={t('upcomingBills')}
            viewAllHref={`/${locale}/bills`}
            viewAllLabel={t('viewAll')}
          >
            <Suspense fallback={<SectionSkeleton rows={3} />}>
              <UpcomingBillsWidget />
            </Suspense>
          </DashboardSection>

          <DashboardSection
            title={t('pendingChores')}
            viewAllHref={`/${locale}/chores`}
            viewAllLabel={t('viewAll')}
          >
            <Suspense fallback={<SectionSkeleton rows={3} />}>
              <PendingChoresWidget />
            </Suspense>
          </DashboardSection>
        </div>
      </div>

      {/* === ChildWallet + Shopping (صف ثاني) === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <DashboardSection
          title={t('childBalance')}
          viewAllHref={`/${locale}/house-economy`}
          viewAllLabel={t('viewAll')}
        >
          <Suspense fallback={<SectionSkeleton rows={3} />}>
            <ChildWalletWidget />
          </Suspense>
        </DashboardSection>

        <DashboardSection
          title={tNav('shopping')}
          viewAllHref={`/${locale}/shopping`}
          viewAllLabel={t('viewAll')}
        >
          <Suspense fallback={<SectionSkeleton rows={3} />}>
            <ShoppingWidget />
          </Suspense>
        </DashboardSection>
      </div>
    </div>
  );
}
