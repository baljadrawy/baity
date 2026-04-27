'use client';

/**
 * ChoreCard — بطاقة عرض مهمة دورية
 *
 * تعرض: اسم المهمة + نوع التكرار + الموعد + من المُسنَد إليه + إجراءات
 * Mobile-first، touch targets ≥ 44px، كل النصوص من i18n
 */

import { useTranslations } from 'next-intl';
import { useFormat } from '@/shared/hooks/useFormat';
import { cn } from '@/shared/lib/utils';
import {
  CheckCircle2, Clock, AlertTriangle, Calendar, User,
  RotateCcw, ChevronLeft, Zap,
} from 'lucide-react';
import type { ChoreWithMeta } from '../api/repository';

interface ChoreCardProps {
  chore: ChoreWithMeta;
  onExecute?: (chore: ChoreWithMeta) => void;
  onEdit?: (chore: ChoreWithMeta) => void;
  onClick?: (chore: ChoreWithMeta) => void;
  compact?: boolean;
}

/** لون المهمة حسب حالتها */
function getChoreColor(chore: ChoreWithMeta): string {
  if (chore.isOverdue) return '#EF4444';
  if (chore.daysUntilDue === 0) return '#F59E0B';
  if (chore.daysUntilDue !== null && chore.daysUntilDue <= 2) return '#F97316';
  return '#10B981';
}

export function ChoreCard({ chore, onExecute, onEdit, onClick, compact = false }: ChoreCardProps) {
  const t = useTranslations('chores');
  const tc = useTranslations('common');
  const f = useFormat();

  const color = getChoreColor(chore);
  const isUrgent = chore.isOverdue || chore.daysUntilDue === 0;

  const dueBadge = () => {
    if (!chore.nextDueDate) return t('manual');
    if (chore.isOverdue)
      return tc('overdueBy', { days: Math.abs(chore.daysUntilDue ?? 0) });
    if (chore.daysUntilDue === 0) return tc('today');
    return tc('daysLeft', { count: chore.daysUntilDue });
  };

  if (compact) {
    return (
      <button
        type="button"
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-xl text-start',
          'hover:bg-muted/50 active:bg-muted transition-colors min-h-[56px]',
          chore.isOverdue && 'bg-red-50/50 dark:bg-red-950/20'
        )}
        onClick={() => onClick?.(chore)}
        aria-label={chore.name}
      >
        {/* أيقونة الحالة */}
        <span
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
          aria-hidden
        >
          {chore.isOverdue ? (
            <AlertTriangle className="w-4 h-4" />
          ) : chore.daysUntilDue === 0 ? (
            <Zap className="w-4 h-4" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{chore.name}</p>
          {chore.assignedMemberNames.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {chore.assignedMemberNames[0]}
            </p>
          )}
        </div>

        <span
          className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {dueBadge()}
        </span>
      </button>
    );
  }

  return (
    <article
      className={cn(
        'bg-card border border-border rounded-2xl overflow-hidden',
        'hover:shadow-md transition-shadow',
        chore.isOverdue && 'border-red-200 dark:border-red-900'
      )}
    >
      {/* شريط اللون */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} aria-hidden />

      <div className="p-4 space-y-3">
        {/* رأس البطاقة */}
        <div className="flex items-start gap-3">
          <span
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15`, color }}
            aria-hidden
          >
            <RotateCcw className="w-5 h-5" />
          </span>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{chore.name}</h3>
            {chore.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {chore.description}
              </p>
            )}
          </div>

          {/* badge الإلحاح */}
          {isUrgent && (
            <span
              className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {chore.isOverdue ? t('overdue') : tc('today')}
            </span>
          )}
        </div>

        {/* معلومات الجدول */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* الموعد القادم */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
            <span>
              {chore.nextDueDate
                ? f.date(chore.nextDueDate)
                : t('manual')}
            </span>
          </div>

          {/* المُسنَد إليه */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
            <span className="truncate">
              {chore.assignedMemberNames.length > 0
                ? chore.assignedMemberNames[0]
                : t('anyMember')}
            </span>
          </div>

          {/* نوع التكرار */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
            <span className="truncate">
              {t(`periodTypes.${chore.periodType.toLowerCase()}`, {
                days: chore.periodDays ?? 1,
              })}
            </span>
          </div>

          {/* آخر تنفيذ */}
          {chore.lastExecution && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
              <span>{f.date(chore.lastExecution.executedAt)}</span>
            </div>
          )}
        </div>

        {/* نقاط المكافأة */}
        {chore.pointsReward > 0 && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs">
            <span aria-hidden>⭐</span>
            <span>{t('pointsReward', { points: chore.pointsReward })}</span>
          </div>
        )}

        {/* أزرار الإجراءات */}
        {(onExecute || onEdit) && (
          <div className="flex gap-2 pt-2 border-t border-border">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(chore)}
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors min-h-[44px]"
              >
                {tc('edit')}
              </button>
            )}
            {onExecute && (
              <button
                type="button"
                onClick={() => onExecute(chore)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors min-h-[44px]',
                  chore.isOverdue
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {t('markDone')}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
