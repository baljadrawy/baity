/**
 * صفحة لوحة المراقبة الإدارية — /admin
 *
 * super-admin only — التحقق عبر isSuperAdminUser (phone مطابق لـ ADMIN_PHONE_NUMBERS env).
 * 404 للجميع عدا الأدمن (لا يكشف وجود الصفحة).
 *
 * يعبر حدود الـ households (cross-platform stats).
 */

import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  Home,
  Users,
  Receipt,
  ClipboardList,
  ShoppingCart,
  Tv2,
  Archive,
  UserPlus,
  CheckCircle2,
  Sparkles,
  Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getServerSession } from '@/core/auth/server-session';
import { isSuperAdminUser } from '@/core/auth/super-admin';
import { AdminRepository } from '@/features/admin/api/repository';
import { formatNumber } from '@/core/i18n/format-number';
import type { Locale } from '@/i18n/config';
import { KpiCard } from '@/shared/ui/KpiCard';
import { DashboardSection } from '@/shared/ui/DashboardSection';
import { cn } from '@/shared/lib/utils';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  if (!session) redirect(`/${locale}/login`);

  const isAdmin = await isSuperAdminUser(session.userId);
  if (!isAdmin) notFound();

  const t = await getTranslations('admin');
  const repo = new AdminRepository();
  const stats = await repo.getStats();
  const lc = locale as Locale;

  const subTotal =
    stats.subscription.inTrial + stats.subscription.active + stats.subscription.cancelled;

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-6xl mx-auto pb-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {/* KPIs الأساسية */}
      <section aria-label={t('totals')}>
        <h2 className="sr-only">{t('totals')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <KpiCard
            icon={Home}
            tone="primary"
            label={t('households')}
            value={formatNumber(stats.totals.households, lc)}
            sub={t('totalHouseholds')}
            ariaLabel={t('households')}
          />
          <KpiCard
            icon={Users}
            tone="info"
            label={t('users')}
            value={formatNumber(stats.totals.users, lc)}
            sub={t('totalUsers')}
            ariaLabel={t('users')}
          />
          <KpiCard
            icon={UserPlus}
            tone="success"
            label={t('signupsToday')}
            value={formatNumber(stats.signups.today, lc)}
            sub={t('signupsLast7', { count: stats.signups.last7Days })}
            ariaLabel={t('signupsToday')}
          />
          <KpiCard
            icon={Activity}
            tone="warning"
            label={t('activeUsers')}
            value={formatNumber(stats.activity.activeUsersLast30Days, lc)}
            sub={t('last30Days')}
            ariaLabel={t('activeUsers')}
          />
        </div>
      </section>

      {/* Content KPIs */}
      <section aria-label={t('content')}>
        <h2 className="sr-only">{t('content')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniStat icon={Receipt} label={t('bills')} value={stats.totals.bills} locale={lc} />
          <MiniStat icon={ClipboardList} label={t('chores')} value={stats.totals.chores} locale={lc} />
          <MiniStat icon={ShoppingCart} label={t('shoppingLists')} value={stats.totals.shoppingLists} locale={lc} />
          <MiniStat icon={Tv2} label={t('appliances')} value={stats.totals.appliances} locale={lc} />
          <MiniStat icon={Archive} label={t('archive')} value={stats.totals.archive} locale={lc} />
          <MiniStat icon={CheckCircle2} label={t('billsPaid7d')} value={stats.activity.billsPaidLast7Days} locale={lc} />
        </div>
      </section>

      {/* Roles distribution + subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <DashboardSection
          title={t('rolesDistribution')}
          description={t('rolesDistributionDesc')}
        >
          <RoleBars roles={stats.usersByRole} locale={lc} />
        </DashboardSection>

        <DashboardSection
          title={t('subscriptions')}
          description={t('subscriptionsDesc')}
        >
          <ul className="flex flex-col gap-3" role="list">
            <SubRow
              label={t('subInTrial')}
              count={stats.subscription.inTrial}
              total={subTotal}
              tone="warning"
              locale={lc}
            />
            <SubRow
              label={t('subActive')}
              count={stats.subscription.active}
              total={subTotal}
              tone="success"
              locale={lc}
            />
            <SubRow
              label={t('subCancelled')}
              count={stats.subscription.cancelled}
              total={subTotal}
              tone="error"
              locale={lc}
            />
          </ul>
        </DashboardSection>
      </div>

      {/* Recent households + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <DashboardSection
          title={t('recentHouseholds')}
          description={t('recentHouseholdsDesc')}
        >
          {stats.recentHouseholds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noHouseholds')}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border" role="list">
              {stats.recentHouseholds.map((h) => (
                <li key={h.id} className="flex items-center gap-3 py-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0"
                    aria-hidden="true"
                  >
                    <Home size={16} strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('membersCount', { count: h.membersCount })} ·{' '}
                      <time dateTime={h.createdAt.toISOString()}>
                        {h.createdAt.toLocaleDateString(
                          lc === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US',
                          { day: 'numeric', month: 'short' }
                        )}
                      </time>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection
          title={t('recentActivity')}
          description={t('recentActivityDesc')}
        >
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noActivity')}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border" role="list">
              {stats.recentActivity.map((a) => (
                <ActivityRow key={a.id} activity={a} locale={lc} t={t} />
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  locale,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  locale: Locale;
}) {
  return (
    <div className="surface-card-elevated p-3 flex items-center gap-2.5">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground flex-shrink-0"
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p
          className="text-base font-bold text-foreground tabular-nums"
          dir="ltr"
          style={{ fontFeatureSettings: '"lnum", "tnum"' }}
        >
          {formatNumber(value, locale)}
        </p>
      </div>
    </div>
  );
}

function RoleBars({
  roles,
  locale,
}: {
  roles: { OWNER: number; ADMIN: number; MEMBER: number; CHILD: number };
  locale: Locale;
}) {
  const total = roles.OWNER + roles.ADMIN + roles.MEMBER + roles.CHILD;
  const items: { key: 'OWNER' | 'ADMIN' | 'MEMBER' | 'CHILD'; tone: string }[] = [
    { key: 'OWNER', tone: 'bg-primary' },
    { key: 'ADMIN', tone: 'bg-info' },
    { key: 'MEMBER', tone: 'bg-success' },
    { key: 'CHILD', tone: 'bg-warning' },
  ];

  if (total === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">—</p>;
  }

  return (
    <ul className="flex flex-col gap-3" role="list">
      {items.map((it) => {
        const count = roles[it.key];
        const pct = Math.round((count / total) * 100);
        return (
          <li key={it.key} className="flex items-center gap-3 text-sm">
            <span className="text-foreground w-20 flex-shrink-0">
              {it.key === 'OWNER'
                ? 'OWNER'
                : it.key === 'ADMIN'
                  ? 'ADMIN'
                  : it.key === 'MEMBER'
                    ? 'MEMBER'
                    : 'CHILD'}
            </span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full transition-all', it.tone)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className="text-foreground font-semibold tabular-nums w-16 text-end"
              dir="ltr"
              style={{ fontFeatureSettings: '"lnum", "tnum"' }}
            >
              {formatNumber(count, locale)} ({pct}%)
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SubRow({
  label,
  count,
  total,
  tone,
  locale,
}: {
  label: string;
  count: number;
  total: number;
  tone: 'success' | 'warning' | 'error';
  locale: Locale;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const toneClass =
    tone === 'success'
      ? 'bg-success'
      : tone === 'warning'
        ? 'bg-warning'
        : 'bg-destructive';
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="text-foreground flex-1 truncate">{label}</span>
      <div className="flex-shrink-0 w-24 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all', toneClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className="text-foreground font-semibold tabular-nums w-12 text-end"
        dir="ltr"
        style={{ fontFeatureSettings: '"lnum", "tnum"' }}
      >
        {formatNumber(count, locale)}
      </span>
    </li>
  );
}

function ActivityRow({
  activity,
  locale,
  t,
}: {
  activity: {
    id: string;
    type: 'household_created' | 'bill_paid' | 'chore_done' | 'member_joined';
    description: string;
    timestamp: Date;
    householdId: string;
  };
  locale: Locale;
  t: (key: string) => string;
}) {
  const meta: Record<typeof activity.type, { icon: LucideIcon; tone: string; key: string }> = {
    household_created: { icon: Home, tone: 'bg-primary/10 text-primary', key: 'activityHouseholdCreated' },
    bill_paid: { icon: Receipt, tone: 'bg-success/10 text-success', key: 'activityBillPaid' },
    chore_done: { icon: CheckCircle2, tone: 'bg-info/10 text-info', key: 'activityChoreDone' },
    member_joined: { icon: Sparkles, tone: 'bg-warning/10 text-warning', key: 'activityMemberJoined' },
  };
  const m = meta[activity.type];
  const Icon = m.icon;

  return (
    <li className="flex items-center gap-3 py-3">
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0',
          m.tone
        )}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-1">
          <span className="text-muted-foreground text-xs">{t(m.key)}:</span>{' '}
          {activity.description}
        </p>
        <p
          className="text-xs text-muted-foreground tabular-nums mt-0.5"
          dir="ltr"
          style={{ fontFeatureSettings: '"lnum", "tnum"' }}
        >
          {activity.timestamp.toLocaleString(
            locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US',
            { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
          )}
        </p>
      </div>
    </li>
  );
}
