'use client';

/**
 * PayBillDialog — نافذة تسجيل دفع فاتورة
 * Sheet على الجوال، Dialog على الديسكتوب
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, CheckCircle2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePayBill } from '../hooks/useBills';
import { payBillSchema, type PayBillInput } from '../schemas';
import { useFormat } from '@/shared/hooks/useFormat';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import { cn } from '@/shared/lib/utils';
import type { BillWithMeta } from '../types';

interface PayBillDialogProps {
  bill: BillWithMeta;
  onClose: () => void;
}

export function PayBillDialog({ bill, onClose }: PayBillDialogProps) {
  const t = useTranslations('bills');
  const tc = useTranslations('common');
  const f = useFormat();
  const [success, setSuccess] = useState(false);

  const payBill = usePayBill(bill.id);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PayBillInput>({
    resolver: zodResolver(payBillSchema),
    defaultValues: {
      amount: Number(bill.amount),
      paidAt: new Date(),
    },
  });

  const onSubmit = async (data: PayBillInput) => {
    await payBill.mutateAsync(data);
    setSuccess(true);
    setTimeout(onClose, 1500);
  };

  const labelClass = 'block text-sm font-medium mb-1.5';
  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px]';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog/Sheet */}
      <div
        role="dialog"
        aria-modal
        aria-labelledby="pay-dialog-title"
        className={cn(
          'fixed z-50 bg-background shadow-xl',
          // جوال: sheet من الأسفل
          'bottom-0 inset-x-0 rounded-t-2xl',
          // desktop: dialog في المنتصف
          'md:inset-auto md:top-1/2 md:start-1/2 md:-translate-y-1/2 md:-translate-x-1/2',
          'md:w-full md:max-w-md md:rounded-2xl'
        )}
      >
        {/* مقبض الـ Sheet (جوال فقط) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>

        <div className="p-5">
          {/* رأس النافذة */}
          <div className="flex items-center justify-between mb-5">
            <h2 id="pay-dialog-title" className="text-lg font-semibold">
              {t('pay.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={tc('close')}
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
          </div>

          {/* معلومات الفاتورة */}
          <div className="p-3 rounded-xl bg-muted mb-5">
            <p className="font-medium">{bill.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5" dir="ltr">
              {f.currency(Number(bill.amount))}
            </p>
          </div>

          {/* حالة النجاح */}
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="text-base font-medium text-emerald-700 dark:text-emerald-400">
                {t('pay.success')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* المبلغ المدفوع */}
              <div>
                <label className={labelClass} htmlFor="pay-amount">
                  {t('pay.amount')}
                </label>
                <div className="relative">
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                      <input
                        id="pay-amount"
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        lang="en"
                        className={`${inputClass} pe-14`}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const converted = convertToWesternDigits(e.target.value);
                          const cleaned = converted.replace(/[^0-9.]/g, '');
                          field.onChange(cleaned ? Number(cleaned) : '');
                        }}
                        aria-invalid={!!errors.amount}
                      />
                    )}
                  />
                  <span
                    className="absolute inset-y-0 end-3 flex items-center text-muted-foreground text-sm pointer-events-none"
                    aria-hidden
                  >
                    {tc('currency')}
                  </span>
                </div>
                {errors.amount && (
                  <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>
                )}
              </div>

              {/* تاريخ الدفع */}
              <div>
                <label className={labelClass} htmlFor="pay-date">
                  {t('pay.date')}
                </label>
                <input
                  id="pay-date"
                  type="date"
                  lang="en"
                  dir="ltr"
                  className={inputClass}
                  defaultValue={new Date().toISOString().split('T')[0]}
                  {...register('paidAt')}
                />
              </div>

              {/* ملاحظات */}
              <div>
                <label className={labelClass} htmlFor="pay-notes">
                  {tc('notes')}
                </label>
                <input
                  id="pay-notes"
                  type="text"
                  className={inputClass}
                  placeholder={t('pay.notesPlaceholder')}
                  {...register('notes')}
                />
              </div>

              {/* أزرار */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors min-h-[52px]"
                >
                  {tc('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={payBill.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors min-h-[52px]"
                >
                  {payBill.isPending ? tc('loading') : t('pay.confirm')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
