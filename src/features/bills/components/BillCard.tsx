'use client';

/**
 * BillCard — بطاقة عرض فاتورة واحدة
 *
 * القواعد:
 * - لا نصوص حرفية في JSX (كل شيء من i18n)
 * - Mobile-first: تعمل على كل الأحجام
 * - الأرقام دائماً عبر useFormat
 * - touch target ≥ 44px
 */

import { useTranslations } from 'next-intl';
import { useFormat } from '@/shared/hooks/useFormat';
import { cn } from '@/shared/lib/utils';
import { CATEGORY_COLORS, CATEGORY_ICONS, getProvider } from '../lib/providers';
import type { BillWithMeta } from '../types';
import {
  Zap, Droplets, Phone, Wifi, Play, Home, Shield, Receipt,
  Clock, CheckCircle2, AlertCircle, AlertTriangle, ChevronLeft,
} from 'lucide-react';

interface BillCardProps {
  bill: BillWithMeta;
  onPay?: (bill: BillWithMeta) => void;
  onEdit?: (bill: BillWithMeta) => void;
  onClick?: (bill: BillWithMeta) => void;
  compact?: boolean; // للـ Dashboard widget
}

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Droplets, Phone, Wifi, Play, Home, Shield, Receipt,
};

export function BillCard({ bill, onPay, onEdit, onClick, compact = false }: BillCardProps) {
  const t = useTranslations('bills');
  const tc = useTranslations('common');
  const f = useFormat();

  const provider = bill.provider ? getProvider(bill.provider) : null;
  const color = provider?.color ?? CATEGORY_COLORS[bill.category] ?? '#6B7280';
  const iconName = CATEGORY_ICONS[bill.category] ?? 'Receipt';
  const IconComponent = ICON_MAP[iconName] ?? Receipt;

  const statusConfig = {
    PENDING: {
      label: t('status.pending'),
      icon: Clock,
      className: 'text-muted-foreground bg-muted',
    },
    DUE: {
      label: t('status.due'),
      icon: AlertCircle,
      className: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950',
    },
    PAID: {
      label: t('status.paid'),
      icon: CheckCircle2,
      className: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950',
    },
    OVERDUE: {
      label: t('status.overdue'),
      icon: AlertTriangle,
      className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950',
    },
  } as const;

  const status = statusConfig[bill.status as keyof typeof statusConfig] ?? statusConfig.PENDING;
  const StatusIcon = status.icon;

  if (compact) {
    return (
      <button
        type="button"
        className={cn(
          'w-full flex items-center gap-3 p-3 rounded-xl',
          'hover:bg-muted/50 active:bg-muted transition-colors',
          'min-h-[56px] text-start'
        )}
        onClick={() => onClick?.(bill)}
        aria-label={`${bill.title} — ${status.label}`}
      >
        {/* أيقونة التصنيف */}
        <span
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
          aria-hidden
        >
          <IconComponent className="w-5 h-5" />
        </span>

        {/* معلومات الفاتورة */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{bill.title}</p>
          <p className="text-xs text-muted-foreground">
            {bill.status !== 'PAID'
              ? bill.daysLeft < 0
                ? `${t('overdueDays', { days: Math.abs(bill.daysLeft) })}`
                : bill.daysLeft === 0
                ? t('dueToday')
                : t('dueIn', { days: bill.daysLeft })
              : f.date(bill.paidAt ?? bill.dueDate)}
          </p>
        </div>

        {/* المبلغ والحالة */}
        <div className="flex-shrink-0 text-end">
          <p
            className="text-sm font-semibold tabular-nums"
            dir="ltr"
          >
            {f.currency(Number(bill.amount))}
          </p>
          <span className={cn('text-xs px-1.5 py-0.5 rounded-full', status.className)}>
            {status.label}
          </span>
        </div>
      </button>
    );
  }

  // البطاقة الكاملة
  return (
    <article
      className={cn(
        'bg-card border border-border rounded-2xl overflow-hidden',
        'hover:shadow-md transition-shadow',
        bill.isOverdue && 'border-red-200 dark:border-red-900'
      )}
    >
      {/* شريط اللون العلوي */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} aria-hidden />

      <div className="p-4">
        {/* الصف العلوي: أيقونة + اسم + حالة */}
        <div className="flex items-start gap-3 mb-3">
          <span
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15`, color }}
            aria-hidden
          >
            <IconComponent className="w-5 h-5" />
          </span>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{bill.title}</h3>
            {provider && (
              <p className="text-xs text-muted-foreground">{provider.nameAr}</p>
            )}
          </div>

          <span
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0',
              status.className
            )}
          >
            <StatusIcon className="w-3 h-3" aria-hidden />
            {status.label}
          </span>
        </div>

        {/* المبلغ والتاريخ */}
        <div className="flex items-end justify-between gap-2 mb-3">
          <div>
            <p className="text-2xl font-bold tabular-nums" dir="ltr">
              {f.currency(Number(bill.amount))}
            </p>
            {bill.accountNumber && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('accountNumber')}: {bill.accountNumber}
              </p>
            )}
          </div>

          <div className="text-end">
            <p className="text-xs text-muted-foreground">{t('dueDate')}</p>
            <p className="text-sm font-medium" dir="ltr">{f.date(bill.dueDate)}</p>
            {bill.status !== 'PAID' && (
              <p
                className={cn(
                  'text-xs mt-0.5',
                  bill.daysLeft < 0
                    ? 'text-red-600 dark:text-red-400'
                    : bill.daysLeft <= 3
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
                )}
              >
                {bill.daysLeft < 0
                  ? t('overdueDays', { days: Math.abs(bill.daysLeft) })
                  : bill.daysLeft === 0
                  ? t('dueToday')
                  : t('dueIn', { days: bill.daysLeft })}
              </p>
            )}
          </div>
        </div>

        {/* ملاحظات */}
        {bill.notes && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{bill.notes}</p>
        )}

        {/* أزرار الإجراءات */}
        {(onPay || onEdit || onClick) && (
          <div className="flex gap-2 pt-2 border-t border-border">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(bill)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium',
                  'border border-border hover:bg-muted transition-colors',
                  'min-h-[44px]'
                )}
              >
                {tc('edit')}
              </button>
            )}
            {onPay && bill.status !== 'PAID' && (
              <button
                type="button"
                onClick={() => onPay(bill)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium',
                  'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                  'min-h-[44px]'
                )}
              >
                {t('markPaid')}
              </button>
            )}
            {onClick && (
              <button
                type="button"
                onClick={() => onClick(bill)}
                className={cn(
                  'p-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px]',
                  'flex items-center justify-center'
                )}
                aria-label={tc('viewDetails')}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
