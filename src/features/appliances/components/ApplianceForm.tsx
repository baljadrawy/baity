'use client';

/**
 * ApplianceForm — نموذج إضافة / تعديل جهاز منزلي
 *
 * Mobile-first، react-hook-form + Zod
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import { createApplianceSchema, type CreateApplianceInput } from '../schemas';

const WARRANTY_TYPES = ['MANUFACTURER', 'STORE', 'EXTENDED', 'THIRD_PARTY', 'NONE'] as const;

interface Props {
  defaultValues?: Partial<CreateApplianceInput>;
  onSubmit: (data: CreateApplianceInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ApplianceForm({ defaultValues, onSubmit, onCancel, isLoading }: Props) {
  const t = useTranslations('appliances');
  const tc = useTranslations('common');

  const { register, handleSubmit, formState: { errors } } = useForm<CreateApplianceInput>({
    resolver: zodResolver(createApplianceSchema),
    defaultValues: {
      warrantyType: 'MANUFACTURER',
      warrantyNotifyDaysBefore: 30,
      isActive: true,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" dir="rtl" noValidate>
      {/* معلومات أساسية */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">{t('basicInfo')}</h3>

        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="a-name">
            {t('name')} <span className="text-red-500" aria-hidden>*</span>
          </label>
          <input id="a-name" {...register('name')}
            placeholder={t('namePlaceholder')}
            className={cn('w-full border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]', errors.name ? 'border-red-500' : 'border-border')} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {([
            { id: 'a-brand', key: 'brand', label: t('brand') },
            { id: 'a-model', key: 'model', label: t('model') },
          ] as const).map(({ id, key, label }) => (
            <div key={id}>
              <label className="text-sm font-medium mb-1.5 block" htmlFor={id}>{label}</label>
              <input id={id} {...register(key)}
                className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="a-category">{t('category')}</label>
            <input id="a-category" {...register('category')} className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="a-location">{t('location')}</label>
            <input id="a-location" {...register('location')} className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]" />
          </div>
        </div>
      </section>

      {/* معلومات الشراء */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">{t('purchaseInfo')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="a-price">{t('purchasePrice')}</label>
            <input id="a-price" inputMode="decimal" dir="ltr" lang="en"
              {...register('purchasePrice', { setValueAs: (v) => v === '' ? undefined : parseFloat(convertToWesternDigits(String(v))) })}
              placeholder="0.00"
              className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="a-pdate">{t('purchaseDate')}</label>
            <input id="a-pdate" type="date" {...register('purchaseDate')}
              className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="a-store">{t('store')}</label>
          <input
            id="a-store"
            list="appliance-stores"
            {...register('store')}
            className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          />
          <datalist id="appliance-stores">
            <option value="اكسترا" />
            <option value="ساكو" />
            <option value="جرير" />
            <option value="حسوب" />
            <option value="نون" />
            <option value="أمازون" />
            <option value="ايكيا" />
            <option value="هوم سنتر" />
            <option value="بنده" />
            <option value="كارفور" />
            <option value="لولو" />
            <option value="هايبر بنده" />
            <option value="الشايع" />
          </datalist>
        </div>
      </section>

      {/* معلومات الضمان */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">{t('warrantyInfo')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="a-wstart">{t('warrantyStart')}</label>
            <input id="a-wstart" type="date" {...register('warrantyStart')}
              className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="a-wend">{t('warrantyExpiry')}</label>
            <input id="a-wend" type="date" {...register('warrantyEnd')}
              className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="a-wtype">{t('warrantyType')}</label>
          <select id="a-wtype" {...register('warrantyType')}
            className="w-full border border-border rounded-xl px-4 py-3 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]">
            {WARRANTY_TYPES.map((wt) => (
              <option key={wt} value={wt}>{t(`warrantyTypes.${wt.toLowerCase()}`)}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ملاحظات */}
      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="a-notes">{tc('notes')}</label>
        <textarea id="a-notes" {...register('notes')} rows={3}
          className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>

      {/* أزرار */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 min-h-[52px] rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors">
          {tc('cancel')}
        </button>
        <button type="submit" disabled={isLoading}
          className="flex-1 min-h-[52px] rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
          {isLoading ? tc('loading') : tc('save')}
        </button>
      </div>
    </form>
  );
}
