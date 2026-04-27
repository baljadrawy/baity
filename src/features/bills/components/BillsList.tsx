'use client';

/**
 * BillsList — عرض قائمة الفواتير مع فلترة وبحث
 *
 * Mobile-first: بطاقة واحدة على الجوال، عمودان على md+، 3 على xl+
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { useBills, useDeleteBill } from '../hooks/useBills';
import { BillCard } from './BillCard';
import { PayBillDialog } from './PayBillDialog';
import type { BillWithMeta } from '../types';
import type { BillFilters } from '../schemas';

interface BillsListProps {
  onAdd?: () => void;
}

const STATUS_FILTER_OPTIONS = ['', 'PENDING', 'DUE', 'PAID', 'OVERDUE'] as const;
const CATEGORY_OPTIONS = [
  '', 'ELECTRICITY', 'WATER', 'TELECOM', 'INTERNET',
  'SUBSCRIPTION', 'RENT', 'INSURANCE', 'OTHER',
] as const;

export function BillsList({ onAdd }: BillsListProps) {
  const t = useTranslations('bills');
  const tc = useTranslations('common');

  const [filters, setFilters] = useState<BillFilters>({ page: 1, limit: 20 });
  const [payingBill, setPayingBill] = useState<BillWithMeta | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useBills(filters);
  useDeleteBill();

  const bills = data?.data ?? [];
  const total = data?.total ?? 0;

  const updateFilter = (patch: Partial<BillFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-sm mb-3">{tc('error')}</p>
        <button
          onClick={() => refetch()}
          className="text-primary text-sm underline underline-offset-2"
        >
          {tc('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* شريط البحث والفلترة */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* بحث */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            className="w-full ps-9 pe-3 py-2.5 text-sm rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px]"
            placeholder={t('searchPlaceholder')}
            onChange={(e) => updateFilter({ search: e.target.value || undefined })}
            aria-label={t('search')}
          />
        </div>

        {/* فلتر الحالة */}
        <select
          className="py-2.5 px-3 text-sm rounded-xl border border-border bg-background min-h-[44px] min-w-[130px]"
          onChange={(e) =>
            updateFilter({
              status: (e.target.value || undefined) as BillFilters['status'],
            })
          }
          aria-label={t('filterByStatus')}
        >
          {STATUS_FILTER_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? t(`status.${s.toLowerCase()}`) : t('allStatuses')}
            </option>
          ))}
        </select>

        {/* فلتر التصنيف */}
        <select
          className="py-2.5 px-3 text-sm rounded-xl border border-border bg-background min-h-[44px] min-w-[130px]"
          onChange={(e) =>
            updateFilter({
              category: (e.target.value || undefined) as BillFilters['category'],
            })
          }
          aria-label={t('filterByCategory')}
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c ? t(`categories.${c.toLowerCase()}`) : t('allCategories')}
            </option>
          ))}
        </select>

        {/* زر الإضافة */}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden />
            {t('add')}
          </button>
        )}
      </div>

      {/* مؤشر التحميل / عدد النتائج */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? tc('loading')
            : t('resultsCount', { count: total })}
        </p>
        {isFetching && !isLoading && (
          <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" aria-hidden />
        )}
      </div>

      {/* حالة التحميل */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* حالة فارغة */}
      {!isLoading && bills.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-3 text-primary text-sm underline underline-offset-2"
            >
              {t('addFirst')}
            </button>
          )}
        </div>
      )}

      {/* قائمة البطاقات */}
      {!isLoading && bills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onPay={() => setPayingBill(bill)}
              onEdit={() => {/* TODO: فتح نافذة التعديل */}}
            />
          ))}
        </div>
      )}

      {/* ترقيم الصفحات */}
      {!isLoading && total > (filters.limit ?? 20) && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={(filters.page ?? 1) <= 1}
            onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-40 min-h-[44px]"
          >
            {tc('previous')}
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground" dir="ltr">
            {filters.page ?? 1} / {Math.ceil(total / (filters.limit ?? 20))}
          </span>
          <button
            disabled={(filters.page ?? 1) >= Math.ceil(total / (filters.limit ?? 20))}
            onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-40 min-h-[44px]"
          >
            {tc('next')}
          </button>
        </div>
      )}

      {/* نافذة دفع الفاتورة */}
      {payingBill && (
        <PayBillDialog
          bill={payingBill}
          onClose={() => setPayingBill(null)}
        />
      )}
    </div>
  );
}
