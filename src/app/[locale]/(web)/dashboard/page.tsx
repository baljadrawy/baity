/**
 * صفحة الرئيسية (Dashboard)
 * Server Component — يجلب البيانات من Prisma مباشرة
 * Mobile-first، كل النصوص من i18n
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/core/db';
import { getServerSession } from '@/core/auth/server-session';
import { StatCard } from '@/shared/ui/StatCard';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { UpcomingBillsWidget } from './_widgets/UpcomingBillsWidget';
import { PendingChoresWidget } from './_widgets/PendingChoresWidget';
import { ChildWalletWidget } from './_widgets/ChildWalletWidget';
import { ShoppingWidget } from './_widgets/ShoppingWidget';
import { HijriCalendarWidget } from './_widgets/HijriCalendarWidget';
import { features } from '@/core/config/features';

/** Skeleton بسيط لـ Suspense */
function WidgetSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  const tNav = await getTranslations('navigation');

  // جلب إحصاءات الـ header
  const session = await getServerSession();

  let stats = { billsDue: 0, overdueChores: 0, shoppingItems: 0, childBalance: 0 };

  if (session) {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);

    const [billsDue, overdueChores, shoppingItems, childWallets] = await Promise.all([
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
      prisma.shoppingItem.count({
        where: {
          isChecked: false,
          list: { householdId: session.householdId, deletedAt: null },
        },
      }),
      prisma.childWallet.findMany({
        where: {
          member: { householdId: session.householdId, role: 'CHILD' },
        },
        select: { balance: true },
      }),
    ]);

    const totalBalance = childWallets.reduce((s, w) => s + Number(w.balance), 0);
    stats = { billsDue, overdueChores, shoppingItems, childBalance: totalBalance };
  }

  return (
    <div className="flex flex-col gap-6">
      {/* الترحيب */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground md:text-2xl">
          {t('greeting', { name: session?.name ?? '' })}
        </h1>
        <p className="text-sm text-muted-foreground">{t('summary')}</p>
      </div>

      {/* بطاقات الإحصاء — 2 أعمدة على الجوال، 4 على desktop */}
      <section aria-label={t('statsSection')}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon="💡"
            label={t('upcomingBills')}
            value={String(stats.billsDue)}
            sub={t('thisMonth')}
            color="warning"
          />
          <StatCard
            icon="✅"
            label={t('pendingChores')}
            value={String(stats.overdueChores)}
            sub={t('overdue')}
            color="error"
          />
          <StatCard
            icon="🛒"
            label={t('shoppingItems')}
            value={String(stats.shoppingItems)}
            sub={t('inLists')}
            color="info"
          />
          <StatCard
            icon="👛"
            label={t('childBalance')}
            value={stats.childBalance.toFixed(2)}
            sub={t('riyals')}
            color="success"
          />
        </div>
      </section>

      {/* التقويم الهجري */}
      {features.hijriCalendar && <HijriCalendarWidget />}

      {/* المحتوى الرئيسي — عمودان على lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* العمود الأول */}
        <div className="flex flex-col gap-6">
          <section aria-label={t('upcomingBills')}>
            <SectionHeader
              title={t('upcomingBills')}
              viewAllHref="/bills"
              viewAllLabel={t('viewAll')}
            />
            <Suspense fallback={<WidgetSkeleton />}>
              <UpcomingBillsWidget />
            </Suspense>
          </section>

          <section aria-label={tNav('shopping')}>
            <SectionHeader
              title={tNav('shopping')}
              viewAllHref="/shopping"
              viewAllLabel={t('viewAll')}
            />
            <Suspense fallback={<WidgetSkeleton />}>
              <ShoppingWidget />
            </Suspense>
          </section>
        </div>

        {/* العمود الثاني */}
        <div className="flex flex-col gap-6">
          <section aria-label={t('pendingChores')}>
            <SectionHeader
              title={t('pendingChores')}
              viewAllHref="/chores"
              viewAllLabel={t('viewAll')}
            />
            <Suspense fallback={<WidgetSkeleton />}>
              <PendingChoresWidget />
            </Suspense>
          </section>

          <section aria-label={t('childBalance')}>
            <SectionHeader
              title={t('childBalance')}
              viewAllHref="/house-economy"
              viewAllLabel={t('viewAll')}
            />
            <Suspense fallback={<WidgetSkeleton />}>
              <ChildWalletWidget />
            </Suspense>
          </section>
        </div>
      </div>
    </div>
  );
}
