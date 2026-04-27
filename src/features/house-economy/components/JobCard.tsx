'use client';

/**
 * JobCard — بطاقة عمل لواجهة الطفل
 *
 * Touch targets ≥ 60px (واجهة أطفال 4-12 سنة)
 * أيقونات emoji كبيرة + ألوان زاهية
 * كل النصوص من i18n
 */

import { useTranslations } from 'next-intl';
import { useFormat } from '@/shared/hooks/useFormat';
import { cn } from '@/shared/lib/utils';
import type { JobMenuItemWithStats } from '../types';

const DIFFICULTY_COLORS = {
  EASY:   { bg: 'bg-emerald-50 dark:bg-emerald-950/30', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  MEDIUM: { bg: 'bg-amber-50   dark:bg-amber-950/30',   badge: 'bg-amber-100   text-amber-700   dark:bg-amber-900   dark:text-amber-300'   },
  HARD:   { bg: 'bg-red-50     dark:bg-red-950/30',     badge: 'bg-red-100     text-red-700     dark:bg-red-900     dark:text-red-300'     },
} as const;

interface JobCardProps {
  job: JobMenuItemWithStats;
  onStart?: (job: JobMenuItemWithStats) => void;
  childAge?: number;
}

export function JobCard({ job, onStart, childAge }: JobCardProps) {
  const t = useTranslations('houseEconomy');
  const f = useFormat();

  const colors = DIFFICULTY_COLORS[job.difficulty];
  const isAgeLocked = childAge !== undefined && childAge < job.minAge;
  const isWeeklyLimitReached =
    job.weeklyLimit !== null &&
    job.weeklyLimit !== undefined &&
    job.completedThisWeek >= job.weeklyLimit;

  const isDisabled = isAgeLocked || isWeeklyLimitReached || !job.isActive;

  return (
    <article
      className={cn(
        'rounded-2xl p-4 border border-transparent transition-all',
        colors.bg,
        isDisabled && 'opacity-60'
      )}
    >
      {/* الأيقونة والعنوان */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/70 dark:bg-black/20 flex items-center justify-center text-3xl shadow-sm"
          aria-hidden
        >
          {job.iconEmoji ?? '📋'}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight">{job.title}</h3>
          {job.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{job.description}</p>
          )}
        </div>
      </div>

      {/* المعلومات */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* الصعوبة */}
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', colors.badge)}>
          {t(`difficulty.${job.difficulty.toLowerCase()}`)}
        </span>

        {/* الوقت المقدر */}
        {job.estimatedMinutes && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {f.number(job.estimatedMinutes)} {t('minutes')}
          </span>
        )}

        {/* الحد الأسبوعي */}
        {job.weeklyLimit && (
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            isWeeklyLimitReached
              ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
              : 'bg-muted text-muted-foreground'
          )}>
            {f.number(job.completedThisWeek)}/{f.number(job.weeklyLimit)} {t('thisWeek')}
          </span>
        )}
      </div>

      {/* المكافأة + زر البدء */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{t('reward')}</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
            {f.currency(Number(job.reward))}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onStart?.(job)}
          disabled={isDisabled}
          className={cn(
            'min-h-[60px] min-w-[100px] px-5 rounded-2xl font-bold text-base transition-all',
            'flex items-center justify-center gap-2',
            isDisabled
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-md'
          )}
        >
          {isWeeklyLimitReached
            ? t('limitReached')
            : isAgeLocked
            ? t('ageLocked')
            : t('startJob')}
        </button>
      </div>

      {/* العمر المناسب */}
      {job.minAge > 4 && (
        <p className="text-xs text-muted-foreground mt-2">
          {t('ageRange', { min: job.minAge, max: job.maxAge ?? 18 })}
        </p>
      )}
    </article>
  );
}
