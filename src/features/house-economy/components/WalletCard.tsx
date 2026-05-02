'use client';

/**
 * WalletCard — بطاقة محفظة الطفل
 *
 * تعرض: الرصيد + توزيع الصرف/الادخار/الصدقة + الهدف الحالي
 * Mobile-first، أرقام دائماً dir="ltr" عبر useFormat
 */

import { useTranslations } from 'next-intl';
import { useFormat } from '@/shared/hooks/useFormat';
import type { ChildWalletWithDetails } from '../types';

interface WalletCardProps {
  wallet: ChildWalletWithDetails;
  onManage?: () => void;
  onAddGoal?: () => void;
  onEditGoal?: () => void;
  onDeleteGoal?: () => void;
  compact?: boolean;
}

export function WalletCard({
  wallet,
  onManage,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  compact = false,
}: WalletCardProps) {
  const t = useTranslations('wallet');
  const f = useFormat();

  const balance = Number(wallet.balance);
  const currentGoal = wallet.goals.find((g) => !g.achievedAt);
  const goalProgress = currentGoal
    ? Math.min(100, Math.round((Number(currentGoal.currentAmount) / Number(currentGoal.targetAmount)) * 100))
    : null;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-xs">{wallet.memberName}</p>
            <p className="text-2xl font-bold mt-1" dir="ltr">{f.currency(balance)}</p>
          </div>
          <span className="text-4xl" aria-hidden>💰</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-5 text-white shadow-lg">
      {/* رأس البطاقة */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-emerald-100 text-sm">{wallet.memberName}</p>
          <p className="text-4xl font-bold mt-1 tabular-nums" dir="ltr">
            {f.currency(balance)}
          </p>
          <p className="text-emerald-100 text-xs mt-1">{t('balance')}</p>
        </div>
        <span className="text-5xl" aria-hidden>💰</span>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: t('earned'), value: Number(wallet.totalEarned), emoji: '⭐' },
          { label: t('saved'),  value: Number(wallet.totalSaved),  emoji: '🏦' },
          { label: t('charity'),value: Number(wallet.totalCharity),emoji: '🤲' },
        ].map(({ label, value, emoji }) => (
          <div key={label} className="bg-white/20 rounded-xl p-2 text-center">
            <span className="text-lg" aria-hidden>{emoji}</span>
            <p className="text-xs text-emerald-100 mt-0.5">{label}</p>
            <p className="text-sm font-bold tabular-nums" dir="ltr">{f.currency(value)}</p>
          </div>
        ))}
      </div>

      {/* هدف الادخار */}
      {currentGoal && goalProgress !== null ? (
        <div className="bg-white/20 rounded-xl p-3 mb-3">
          <div className="flex justify-between items-center gap-2 mb-1.5">
            <p className="text-sm font-medium truncate flex-1">{currentGoal.title}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <p
                className="text-xs text-emerald-100 tabular-nums"
                dir="ltr"
                style={{ fontFeatureSettings: '"lnum", "tnum"' }}
              >
                {f.number(goalProgress)}%
              </p>
              {onEditGoal && (
                <button
                  type="button"
                  onClick={onEditGoal}
                  className="text-emerald-100 hover:text-white text-xs px-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={t('editGoal')}
                >
                  ✎
                </button>
              )}
              {onDeleteGoal && (
                <button
                  type="button"
                  onClick={onDeleteGoal}
                  className="text-emerald-100 hover:text-white text-xs px-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={t('deleteGoal')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2.5">
            <div
              className="bg-white rounded-full h-2.5 transition-all duration-500"
              style={{ width: `${goalProgress}%` }}
              role="progressbar"
              aria-valuenow={goalProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            {goalProgress >= 100
              ? t('goalReached')
              : t('remaining', {
                  amount: f.currency(Number(currentGoal.targetAmount) - Number(currentGoal.currentAmount)),
                })}
          </p>
        </div>
      ) : (
        onAddGoal && (
          <button
            type="button"
            onClick={onAddGoal}
            className="w-full min-h-[44px] bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors mb-3"
          >
            {t('addGoal')}
          </button>
        )
      )}

      {/* زر الإدارة */}
      {onManage && (
        <button
          type="button"
          onClick={onManage}
          className="w-full min-h-[44px] bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
        >
          {t('distribution.title')}
        </button>
      )}
    </div>
  );
}
