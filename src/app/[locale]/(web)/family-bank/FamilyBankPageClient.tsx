'use client';

/**
 * FamilyBankPageClient — واجهة بنك العائلة
 *
 * تعرض: KPIs (الرصيد/المدخرات/الصدقة/الفائدة الشهرية)
 *      + توزيع لكل طفل
 *      + سجل آخر المعاملات
 */

import { useTranslations } from 'next-intl';
import {
  Wallet,
  PiggyBank,
  HandHeart,
  TrendingUp,
  Sparkles,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  HeartHandshake,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useFamilyBank } from '@/features/family-bank/hooks/useFamilyBank';
import { useFormat } from '@/shared/hooks/useFormat';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { EmptyState } from '@/shared/ui/EmptyState';
import { KpiCard } from '@/shared/ui/KpiCard';
import { DashboardSection } from '@/shared/ui/DashboardSection';
import { cn } from '@/shared/lib/utils';

type TxType =
  | 'JOB_REWARD'
  | 'BONUS'
  | 'SPEND'
  | 'SAVE_DEPOSIT'
  | 'CHARITY'
  | 'GIFT'
  | 'TRANSFER'
  | 'WEEKLY_ALLOWANCE';

const TX_META: Record<TxType, { icon: LucideIcon; tone: string; sign: 1 | -1 | 0 }> = {
  JOB_REWARD: { icon: Sparkles, tone: 'bg-success/10 text-success', sign: 1 },
  BONUS: { icon: TrendingUp, tone: 'bg-primary/10 text-primary', sign: 1 },
  SPEND: { icon: ArrowUpFromLine, tone: 'bg-warning/10 text-warning', sign: -1 },
  SAVE_DEPOSIT: { icon: PiggyBank, tone: 'bg-info/10 text-info', sign: 0 },
  CHARITY: { icon: HandHeart, tone: 'bg-success/10 text-success', sign: -1 },
  GIFT: { icon: Gift, tone: 'bg-primary/10 text-primary', sign: 1 },
  TRANSFER: { icon: HeartHandshake, tone: 'bg-info/10 text-info', sign: 0 },
  WEEKLY_ALLOWANCE: { icon: ArrowDownToLine, tone: 'bg-success/10 text-success', sign: 1 },
};

export function FamilyBankPageClient() {
  const t = useTranslations('familyBank');
  const tc = useTranslations('common');
  const f = useFormat();

  const { data, isLoading, isError } = useFamilyBank();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !data?.data) {
    return <EmptyState icon="⚠️" title={tc('error')} />;
  }

  const summary = data.data;

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto pb-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('interestRate', { rate: f.number(summary.monthlyInterestRate) })}
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          icon={Wallet}
          tone="primary"
          label={t('balance')}
          value={f.currency(summary.totalBalance)}
          sub={t('walletsCount', { count: summary.walletsCount })}
          ariaLabel={`${t('balance')}: ${f.currency(summary.totalBalance)}`}
        />
        <KpiCard
          icon={PiggyBank}
          tone="info"
          label={t('totalSaved')}
          value={f.currency(summary.totalSaved)}
          sub={t('estimatedNextInterest', {
            amount: f.currency(summary.estimatedNextInterest),
          })}
          ariaLabel={`${t('totalSaved')}: ${f.currency(summary.totalSaved)}`}
        />
        <KpiCard
          icon={HandHeart}
          tone="success"
          label={t('totalCharity')}
          value={f.currency(summary.totalCharity)}
          sub={t('totalEarned', { amount: f.currency(summary.totalEarned) })}
          ariaLabel={`${t('totalCharity')}: ${f.currency(summary.totalCharity)}`}
        />
        <KpiCard
          icon={TrendingUp}
          tone="warning"
          label={t('monthlyInterest')}
          value={f.currency(summary.thisMonthInterest)}
          sub={t('thisMonth')}
          ariaLabel={`${t('monthlyInterest')}: ${f.currency(summary.thisMonthInterest)}`}
        />
      </div>

      {/* توزيع الأعضاء */}
      <DashboardSection
        title={t('membersBreakdown')}
        description={t('membersBreakdownDesc')}
      >
        {summary.members.length === 0 ? (
          <EmptyState icon="👨‍👩‍👧" title={t('noMembers')} description={t('noMembersDesc')} />
        ) : (
          <ul className="flex flex-col gap-2" role="list">
            {summary.members.map((m) => {
              const total = summary.totalBalance || 1;
              const pct = Math.round((m.balance / total) * 100);
              return (
                <li
                  key={m.memberId}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-base flex-shrink-0"
                    aria-hidden="true"
                  >
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                    <div className="mt-1 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 tabular-nums" dir="ltr" style={{ fontFeatureSettings: '"lnum", "tnum"' }}>
                      <span>{t('saved')}: {f.currency(m.totalSaved)}</span>
                      <span>·</span>
                      <span>{t('charity')}: {f.currency(m.totalCharity)}</span>
                    </div>
                  </div>
                  <p
                    className="text-base font-bold text-foreground tabular-nums flex-shrink-0"
                    dir="ltr"
                    style={{ fontFeatureSettings: '"lnum", "tnum"' }}
                  >
                    {f.currency(m.balance)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>

      {/* سجل المعاملات */}
      <DashboardSection
        title={t('history')}
        description={t('historyDesc')}
      >
        {summary.recentTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t('empty')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border" role="list">
            {summary.recentTransactions.map((tx) => {
              const meta = TX_META[tx.type as TxType] ?? TX_META.BONUS;
              const Icon = meta.icon;
              const sign = meta.sign;
              const valueClass =
                sign === 1 ? 'text-success' : sign === -1 ? 'text-destructive' : 'text-foreground';
              const prefix = sign === 1 ? '+' : sign === -1 ? '−' : '';

              return (
                <li key={tx.id} className="flex items-center gap-3 py-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0',
                      meta.tone
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={16} strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tx.memberName} · {f.shortDate(tx.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums flex-shrink-0',
                      valueClass
                    )}
                    dir="ltr"
                    style={{ fontFeatureSettings: '"lnum", "tnum"' }}
                  >
                    {prefix}
                    {f.currency(Math.abs(tx.amount))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
