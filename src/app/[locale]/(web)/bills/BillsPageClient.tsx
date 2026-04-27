'use client';

/**
 * BillsPageClient — الجزء التفاعلي من صفحة الفواتير
 *
 * يدير: إضافة فاتورة جديدة + عرض الملخص + قائمة الفواتير
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBillsSummary } from '@/features/bills/hooks/useBills';
import { BillsList } from '@/features/bills/components/BillsList';
import { BillForm } from '@/features/bills/components/BillForm';
import { useCreateBill } from '@/features/bills/hooks/useBills';
import { useFormat } from '@/shared/hooks/useFormat';
import { StatCard } from '@/shared/components/StatCard';
import { X, Receipt, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export function BillsPageClient() {
  const t = useTranslations('bills');
  const tc = useTranslations('common');
  const f = useFormat();

  const [showAddForm, setShowAddForm] = useState(false);
  const { data: summary, isLoading: summaryLoading } = useBillsSummary();
  const createBill = useCreateBill();

  const handleCreate = async (data: Parameters<typeof createBill.mutateAsync>[0]) => {
    await createBill.mutateAsync(data);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصاء */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title={t('summary.due')}
          value={summaryLoading ? '...' : f.currency(summary?.totalDue ?? 0)}
          icon={Receipt}
          color="amber"
          dir="ltr"
        />
        <StatCard
          title={t('summary.overdue')}
          value={summaryLoading ? '...' : f.currency(summary?.totalOverdue ?? 0)}
          icon={AlertTriangle}
          color="red"
          dir="ltr"
        />
        <StatCard
          title={t('summary.upcoming')}
          value={summaryLoading ? '...' : String(summary?.upcomingCount ?? 0)}
          icon={Clock}
          color="blue"
          dir="ltr"
        />
        <StatCard
          title={t('summary.paidThisMonth')}
          value={summaryLoading ? '...' : String(summary?.paidThisMonth ?? 0)}
          icon={CheckCircle2}
          color="green"
          dir="ltr"
        />
      </div>

      {/* نافذة إضافة فاتورة */}
      {showAddForm && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowAddForm(false)}
            aria-hidden
          />

          {/* Sheet / Dialog */}
          <div
            role="dialog"
            aria-modal
            aria-labelledby="add-bill-title"
            className={cn(
              'fixed z-50 bg-background shadow-xl overflow-y-auto',
              'bottom-0 inset-x-0 rounded-t-2xl max-h-[92dvh]',
              'md:inset-auto md:top-1/2 md:start-1/2',
              'md:-translate-y-1/2 md:-translate-x-1/2',
              'md:w-full md:max-w-lg md:rounded-2xl md:max-h-[90dvh]'
            )}
          >
            {/* مقبض جوال */}
            <div className="md:hidden flex justify-center pt-3 pb-1 sticky top-0 bg-background">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 id="add-bill-title" className="text-lg font-semibold">
                  {t('add')}
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={tc('close')}
                >
                  <X className="w-5 h-5" aria-hidden />
                </button>
              </div>

              <BillForm
                onSubmit={handleCreate}
                isLoading={createBill.isPending}
                submitLabel={t('addConfirm')}
              />
            </div>
          </div>
        </>
      )}

      {/* قائمة الفواتير */}
      <BillsList onAdd={() => setShowAddForm(true)} />
    </div>
  );
}
