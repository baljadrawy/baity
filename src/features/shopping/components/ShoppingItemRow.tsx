'use client';

/**
 * ShoppingItemRow — صف عنصر في قائمة المشتريات
 *
 * Checkbox كبير (touch ≥44px)، swipe-to-delete على الجوال
 * الحالة: pending (أبيض) | checked (خطّ + رمادي)
 */

import { useTranslations } from 'next-intl';
import { useFormat } from '@/shared/hooks/useFormat';
import { Trash2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ShoppingItem } from '@prisma/client';

const URGENCY_DOT: Record<string, string> = {
  HIGH:   'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW:    'bg-muted-foreground/30',
};

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (itemId: string, isChecked: boolean) => void;
  onDelete: (itemId: string) => void;
}

export function ShoppingItemRow({ item, onToggle, onDelete }: ShoppingItemRowProps) {
  const tc = useTranslations('common');
  const f = useFormat();

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3 px-1 border-b border-border/50 last:border-0',
        'transition-opacity',
        item.isChecked && 'opacity-60'
      )}
    >
      {/* Checkbox كبير */}
      <button
        type="button"
        onClick={() => onToggle(item.id, !item.isChecked)}
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all min-h-[44px] min-w-[44px]',
          item.isChecked
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-border hover:border-primary'
        )}
        aria-label={item.isChecked ? 'إلغاء التأشير' : 'تأشير كمشترى'}
        aria-pressed={item.isChecked}
      >
        {item.isChecked && (
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* نقطة الأولوية */}
      <span
        className={cn('flex-shrink-0 w-2 h-2 rounded-full', URGENCY_DOT[item.urgency])}
        aria-hidden
      />

      {/* المحتوى */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', item.isChecked && 'line-through text-muted-foreground')}>
          {item.name}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {item.quantity && (
            <span className="text-xs text-muted-foreground">
              {item.quantity} {item.unit ?? ''}
            </span>
          )}
          {item.category && (
            <span className="text-xs text-muted-foreground">{item.category}</span>
          )}
          {item.store && (
            <span className="text-xs text-muted-foreground">{item.store}</span>
          )}
        </div>
      </div>

      {/* السعر */}
      {item.estimatedPrice && (
        <span className="flex-shrink-0 text-xs text-muted-foreground tabular-nums" dir="ltr">
          {f.currency(Number(item.estimatedPrice))}
        </span>
      )}

      {/* حذف */}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        aria-label={tc('delete')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
