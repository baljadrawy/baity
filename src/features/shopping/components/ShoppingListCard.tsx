'use client';

/**
 * ShoppingListCard — بطاقة قائمة مشتريات
 *
 * تعرض: اسم القائمة + شريط التقدم + عدد العناصر + التكلفة التقديرية
 * Mobile-first، touch targets ≥44px
 */

import { useTranslations } from 'next-intl';
import { useFormat } from '@/shared/hooks/useFormat';
import { ShoppingCart, Trash2, CheckCheck } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ShoppingListWithMeta } from '../types';

interface ShoppingListCardProps {
  list: ShoppingListWithMeta;
  onClick: (list: ShoppingListWithMeta) => void;
  onDelete?: (id: string) => void;
}

export function ShoppingListCard({ list, onClick, onDelete }: ShoppingListCardProps) {
  const t = useTranslations('shopping');
  const tc = useTranslations('common');
  const f = useFormat();

  const isComplete = list.completionRate === 100;

  return (
    <article
      className={cn(
        'bg-card border border-border rounded-2xl overflow-hidden',
        'hover:shadow-md transition-shadow cursor-pointer'
      )}
      onClick={() => onClick(list)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(list)}
      aria-label={list.name}
    >
      <div className="p-4 space-y-3">
        {/* الرأس */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                isComplete
                  ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
                  : 'bg-primary/10 text-primary'
              )}
              aria-hidden
            >
              {isComplete ? <CheckCheck className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{list.name}</h3>
              <p className="text-xs text-muted-foreground">
                {f.number(list.checkedItems)}/{f.number(list.totalItems)} {t('items')}
              </p>
            </div>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(list.id); }}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              aria-label={tc('delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* شريط التقدم */}
        {list.totalItems > 0 && (
          <div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-500',
                  isComplete ? 'bg-emerald-500' : 'bg-primary'
                )}
                style={{ width: `${list.completionRate}%` }}
                role="progressbar"
                aria-valuenow={list.completionRate}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        {/* التكلفة */}
        {list.estimatedTotal > 0 && (
          <p className="text-xs text-muted-foreground">
            {t('estimatedTotal')}{' '}
            <span className="font-medium text-foreground" dir="ltr">
              {f.currency(list.estimatedTotal)}
            </span>
          </p>
        )}

        {/* مشتركة */}
        {list.isShared && (
          <span className="inline-flex text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
            {t('shared')}
          </span>
        )}
      </div>
    </article>
  );
}
