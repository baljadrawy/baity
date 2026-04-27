'use client';

/**
 * BillForm — نموذج إضافة وتعديل الفواتير
 *
 * القواعد:
 * - react-hook-form + Zod
 * - كل النصوص من i18n
 * - تحويل الأرقام الهندية تلقائياً
 * - Mobile-first (عمود واحد على الجوال، عمودان على md+)
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { createBillSchema, type CreateBillInput } from '../schemas';
import { SERVICE_PROVIDERS, getProvidersByCategory, CATEGORY_COLORS } from '../lib/providers';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import type { BillWithMeta } from '../types';

interface BillFormProps {
  defaultValues?: Partial<CreateBillInput>;
  onSubmit: (data: CreateBillInput) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const CATEGORIES = [
  'ELECTRICITY', 'WATER', 'TELECOM', 'INTERNET',
  'SUBSCRIPTION', 'RENT', 'INSURANCE', 'OTHER',
] as const;

export function BillForm({ defaultValues, onSubmit, isLoading, submitLabel }: BillFormProps) {
  const t = useTranslations('bills');
  const tc = useTranslations('common');
  const te = useTranslations('errors');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateBillInput>({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      isRecurring: false,
      ...defaultValues,
    },
  });

  const selectedCategory = watch('category');
  const isRecurring = watch('isRecurring');
  const providersInCategory = selectedCategory
    ? getProvidersByCategory(selectedCategory)
    : [];

  const labelClass = 'block text-sm font-medium mb-1.5';
  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition min-h-[44px]';
  const errorClass = 'text-xs text-red-600 dark:text-red-400 mt-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

      {/* الاسم */}
      <div>
        <label className={labelClass} htmlFor="bill-title">
          {t('form.title')} <span className="text-red-500">*</span>
        </label>
        <input
          id="bill-title"
          type="text"
          className={inputClass}
          placeholder={t('form.titlePlaceholder')}
          {...register('title')}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className={errorClass}>{errors.title.message}</p>
        )}
      </div>

      {/* التصنيف + المزود: عمودان على md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* التصنيف */}
        <div>
          <label className={labelClass} htmlFor="bill-category">
            {t('form.category')} <span className="text-red-500">*</span>
          </label>
          <select
            id="bill-category"
            className={inputClass}
            {...register('category')}
            aria-invalid={!!errors.category}
          >
            <option value="">{t('form.selectCategory')}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categories.${cat.toLowerCase()}`)}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className={errorClass}>{errors.category.message}</p>
          )}
        </div>

        {/* المزود — يظهر فقط إذا في مزودون لهذا التصنيف */}
        <div>
          <label className={labelClass} htmlFor="bill-provider">
            {t('form.provider')}
          </label>
          {providersInCategory.length > 0 ? (
            <select
              id="bill-provider"
              className={inputClass}
              {...register('provider')}
            >
              <option value="">{t('form.selectProvider')}</option>
              {providersInCategory.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameAr}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="bill-provider"
              type="text"
              className={inputClass}
              placeholder={t('form.providerPlaceholder')}
              {...register('provider')}
            />
          )}
        </div>
      </div>

      {/* رقم الحساب */}
      <div>
        <label className={labelClass} htmlFor="bill-account">
          {t('form.accountNumber')}
        </label>
        <input
          id="bill-account"
          type="text"
          inputMode="text"
          className={inputClass}
          placeholder={t('form.accountNumberPlaceholder')}
          {...register('accountNumber')}
        />
      </div>

      {/* المبلغ + تاريخ الاستحقاق: عمودان */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* المبلغ */}
        <div>
          <label className={labelClass} htmlFor="bill-amount">
            {t('form.amount')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <input
                  id="bill-amount"
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  lang="en"
                  className={`${inputClass} ps-3 pe-14`}
                  placeholder="0.00"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    // تحويل الأرقام الهندية تلقائياً
                    const converted = convertToWesternDigits(e.target.value);
                    const cleaned = converted.replace(/[^0-9.]/g, '');
                    field.onChange(cleaned ? Number(cleaned) : '');
                  }}
                  aria-invalid={!!errors.amount}
                  aria-describedby={errors.amount ? 'amount-error' : undefined}
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
            <p id="amount-error" className={errorClass}>{errors.amount.message}</p>
          )}
        </div>

        {/* تاريخ الاستحقاق */}
        <div>
          <label className={labelClass} htmlFor="bill-due-date">
            {t('form.dueDate')} <span className="text-red-500">*</span>
          </label>
          <input
            id="bill-due-date"
            type="date"
            lang="en"
            dir="ltr"
            className={inputClass}
            {...register('dueDate')}
            aria-invalid={!!errors.dueDate}
          />
          {errors.dueDate && (
            <p className={errorClass}>{errors.dueDate.message}</p>
          )}
        </div>
      </div>

      {/* متكررة */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
        <Controller
          name="isRecurring"
          control={control}
          render={({ field }) => (
            <input
              id="bill-recurring"
              type="checkbox"
              className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <label htmlFor="bill-recurring" className="flex-1 cursor-pointer">
          <span className="text-sm font-medium block">{t('form.isRecurring')}</span>
          <span className="text-xs text-muted-foreground">{t('form.isRecurringHint')}</span>
        </label>

        {isRecurring && (
          <select
            className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background min-h-[36px]"
            {...register('recurrencePeriod')}
            aria-label={t('form.recurrencePeriod')}
          >
            <option value="MONTHLY">{t('recurrence.monthly')}</option>
            <option value="WEEKLY">{t('recurrence.weekly')}</option>
            <option value="QUARTERLY">{t('recurrence.quarterly')}</option>
            <option value="YEARLY">{t('recurrence.yearly')}</option>
            <option value="DAILY">{t('recurrence.daily')}</option>
          </select>
        )}
      </div>

      {/* ملاحظات */}
      <div>
        <label className={labelClass} htmlFor="bill-notes">
          {t('form.notes')}
        </label>
        <textarea
          id="bill-notes"
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder={t('form.notesPlaceholder')}
          {...register('notes')}
        />
      </div>

      {/* زر الإرسال */}
      <button
        type="submit"
        disabled={isLoading}
        className={
          'w-full py-3 rounded-xl text-sm font-semibold min-h-[52px] ' +
          'bg-primary text-primary-foreground hover:bg-primary/90 ' +
          'disabled:opacity-60 disabled:cursor-not-allowed transition-colors'
        }
      >
        {isLoading ? tc('loading') : (submitLabel ?? tc('save'))}
      </button>
    </form>
  );
}
