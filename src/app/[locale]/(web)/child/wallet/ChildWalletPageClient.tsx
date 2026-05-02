'use client';

/**
 * ChildWalletPageClient — محفظة الطفل بأسلوب طفولي
 *
 * تعرض: محفظة كبيرة + سجل آخر المعاملات + هدف الادخار
 * children-ui (touch ≥ 60px)
 */

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, Sparkles, ShoppingBag, HandHeart, PiggyBank, Gift } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useChildWallet } from '@/features/house-economy/hooks/useHouseEconomy';
import { WalletCard } from '@/features/house-economy/components/WalletCard';
import { useFormat } from '@/shared/hooks/useFormat';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import type { ChildWalletWithDetails } from '@/features/house-economy/types';
import { cn } from '@/shared/lib/utils';

interface ChildWalletPageClientProps {
  memberId: string;
  childName: string;
}

type TxType = 'JOB_REWARD' | 'BONUS' | 'SPEND' | 'SAVE_DEPOSIT' | 'CHARITY' | 'GIFT' | 'TRANSFER' | 'WEEKLY_ALLOWANCE';

const TX_META: Record<TxType, { icon: LucideIcon; tone: string; sign: 1 | -1 | 0 }> = {
  JOB_REWARD: { icon: Sparkles, tone: 'bg-success/15 text-success', sign: 1 },
  BONUS: { icon: Gift, tone: 'bg-primary/15 text-primary', sign: 1 },
  SPEND: { icon: ShoppingBag, tone: 'bg-warning/15 text-warning', sign: -1 },
  SAVE_DEPOSIT: { icon: PiggyBank, tone: 'bg-info/15 text-info', sign: 0 },
  CHARITY: { icon: HandHeart, tone: 'bg-success/15 text-success', sign: -1 },
  GIFT: { icon: Gift, tone: 'bg-primary/15 text-primary', sign: 1 },
  TRANSFER: { icon: ArrowLeft, tone: 'bg-info/15 text-info', sign: 0 },
  WEEKLY_ALLOWANCE: { icon: Sparkles, tone: 'bg-success/15 text-success', sign: 1 },
};

export function ChildWalletPageClient({ memberId, childName }: ChildWalletPageClientProps) {
  const t = useTranslations('wallet');
  const tc = useTranslations('common');
  const f = useFormat();
  const locale = useLocale();

  const { data, isLoading } = useChildWallet(memberId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const wallet = (data as { data?: ChildWalletWithDetails } | undefined)?.data;
  if (!wallet) {
    return (
      <p className="text-center text-base text-muted-foreground py-12">
        {t('noWallets')}
      </p>
    );
  }

  const recentTx = (wallet.recentTransactions ?? []).slice(0, 8);

  return (
    <div className="children-ui flex flex-col gap-5 max-w-2xl mx-auto pb-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          {t('title')} — {childName}
        </h1>
        <Link
          href={`/${locale}/child/menu`}
          className="text-sm text-primary inline-flex items-center gap-1 min-h-[60px] px-2"
        >
          <ArrowLeft size={18} aria-hidden="true" className="rtl:rotate-180" />
          {tc('back')}
        </Link>
      </header>

      <WalletCard wallet={wallet} />

      {/* سجل المعاملات */}
      <section className="surface-card-elevated p-5 flex flex-col gap-3">
        <header className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-foreground">{t('history')}</h2>
        </header>

        {recentTx.length === 0 ? (
          <p className="text-base text-muted-foreground text-center py-6">{t('noWalletsDesc')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border" role="list">
            {recentTx.map((tx) => {
              const meta = TX_META[tx.type as TxType] ?? TX_META.BONUS;
              const Icon = meta.icon;
              const sign = meta.sign;
              const valueClass =
                sign === 1
                  ? 'text-success'
                  : sign === -1
                    ? 'text-destructive'
                    : 'text-foreground';
              const prefix = sign === 1 ? '+' : sign === -1 ? '−' : '';
              return (
                <li key={tx.id} className="flex items-center gap-3 py-3">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0',
                      meta.tone
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={20} strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-foreground line-clamp-1">
                      {tx.description}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {f.shortDate(tx.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-base font-bold tabular-nums flex-shrink-0',
                      valueClass
                    )}
                    dir="ltr"
                    style={{ fontFeatureSettings: '"lnum", "tnum"' }}
                  >
                    {prefix}
                    {f.currency(Math.abs(Number(tx.amount)))}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
