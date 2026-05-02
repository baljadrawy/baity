'use client';

/**
 * ChildMenuPageClient — منيو أعمال الطفل (تفاعلي بأسلوب طفولي)
 *
 * Touch ≥ 60px (children-ui) — ألوان زاهية — emoji كبير
 * يستخدم نفس JobMenuGrid لكن بحجم أكبر، مع زر "ابدأ" مباشر
 */

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Wallet, Sparkles, Loader2 } from 'lucide-react';
import {
  useJobMenuItems,
  useStartJob,
  useChildWallet,
} from '@/features/house-economy/hooks/useHouseEconomy';
import { useFormat } from '@/shared/hooks/useFormat';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { EmptyState } from '@/shared/ui/EmptyState';
import { cn } from '@/shared/lib/utils';

interface ChildMenuPageClientProps {
  memberId: string;
  childName: string;
  isChild: boolean;
}

interface JobMenuLite {
  id: string;
  title: string;
  iconEmoji: string | null;
  reward: string | number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedMinutes: number;
  minAge: number;
  maxAge: number | null;
  isActive: boolean;
}

const DIFFICULTY_TONE: Record<JobMenuLite['difficulty'], string> = {
  EASY: 'bg-success/15 text-success border-success/30',
  MEDIUM: 'bg-warning/15 text-warning border-warning/30',
  HARD: 'bg-destructive/15 text-destructive border-destructive/30',
};

export function ChildMenuPageClient({
  memberId,
  childName,
  isChild,
}: ChildMenuPageClientProps) {
  const t = useTranslations('houseEconomy');
  const tDifficulty = useTranslations('houseEconomy.difficulty');
  const f = useFormat();
  const locale = useLocale();

  const { data: jobsData, isLoading: jobsLoading } = useJobMenuItems({
    isActive: true,
    childId: isChild ? memberId : undefined,
  });
  const { data: walletData } = useChildWallet(memberId);

  const startJob = useStartJob();

  const jobs = (jobsData?.data ?? []) as JobMenuLite[];
  const wallet = (walletData as { data?: { balance: string | number } } | undefined)?.data;
  const balance = wallet ? Number(wallet.balance) : 0;

  const handleStart = (jobId: string) => {
    startJob.mutate({ jobMenuItemId: jobId });
  };

  return (
    <div className="children-ui flex flex-col gap-5 max-w-3xl mx-auto pb-6">
      {/* رأس مع ترحيب + رصيد */}
      <header className="surface-card-elevated p-5 flex items-center justify-between gap-4 bg-gradient-to-br from-primary/15 to-info/10">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">👋</span>
          <div>
            <p className="text-base font-bold text-foreground">
              {t('childGreeting', { name: childName })}
            </p>
            <p className="text-sm text-muted-foreground">{t('startJob')}</p>
          </div>
        </div>
        <Link
          href={`/${locale}/child/wallet`}
          className="flex items-center gap-2 rounded-2xl bg-success/15 text-success px-4 py-3 font-bold text-base"
        >
          <Wallet size={22} aria-hidden="true" />
          <span
            className="tabular-nums"
            dir="ltr"
            style={{ fontFeatureSettings: '"lnum", "tnum"' }}
          >
            {f.currency(balance)}
          </span>
        </Link>
      </header>

      {/* القائمة */}
      {jobsLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState icon="🎯" title={t('noJobsAvailable')} />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list">
          {jobs.map((job) => {
            const reward = Number(job.reward);
            return (
              <li
                key={job.id}
                className="surface-card-elevated p-5 flex flex-col gap-3 transition-smooth hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="text-5xl flex-shrink-0" aria-hidden="true">
                    {job.iconEmoji ?? '⭐'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground line-clamp-2">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={cn(
                          'trend-pill border',
                          DIFFICULTY_TONE[job.difficulty]
                        )}
                      >
                        {tDifficulty(job.difficulty.toLowerCase() as 'easy')}
                      </span>
                      <span
                        className="trend-pill bg-muted/40 text-muted-foreground tabular-nums"
                        dir="ltr"
                        style={{ fontFeatureSettings: '"lnum", "tnum"' }}
                      >
                        ⏱ {t('estimatedShort', { minutes: job.estimatedMinutes })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl" aria-hidden="true">💰</span>
                    <span
                      className="text-xl font-bold text-success tabular-nums"
                      dir="ltr"
                      style={{ fontFeatureSettings: '"lnum", "tnum"' }}
                    >
                      {f.currency(reward)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStart(job.id)}
                    disabled={startJob.isPending}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-smooth"
                  >
                    {startJob.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                    )}
                    {t('startJob')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
