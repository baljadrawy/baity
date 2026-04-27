'use client';

/**
 * JobForm — نموذج إضافة / تعديل عمل (ولي الأمر)
 *
 * Mobile-first، react-hook-form + Zod
 * كل النصوص من i18n
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import { createJobMenuItemSchema, type CreateJobMenuItemInput } from '../schemas';

interface JobFormProps {
  defaultValues?: Partial<CreateJobMenuItemInput>;
  onSubmit: (data: CreateJobMenuItemInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DIFFICULTY_OPTIONS = ['EASY', 'MEDIUM', 'HARD'] as const;
const EMOJI_SUGGESTIONS = ['🧹', '🍳', '🌿', '🧺', '📚', '🐕', '🛏️', '🧽', '♻️', '🛒', '💧', '🔧'];

export function JobForm({ defaultValues, onSubmit, onCancel, isLoading }: JobFormProps) {
  const t = useTranslations('houseEconomy');
  const tc = useTranslations('common');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateJobMenuItemInput>({
    resolver: zodResolver(createJobMenuItemSchema),
    defaultValues: {
      difficulty: 'EASY',
      minAge: 4,
      isActive: true,
      availableForIds: [],
      ...defaultValues,
    },
  });

  const selectedEmoji = watch('iconEmoji');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" dir="rtl" noValidate>
      {/* الأيقونة */}
      <div>
        <label className="text-sm font-medium mb-2 block">{t('form.icon')}</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {EMOJI_SUGGESTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setValue('iconEmoji', emoji)}
              className={cn(
                'w-11 h-11 text-2xl rounded-xl border-2 transition-all',
                selectedEmoji === emoji
                  ? 'border-primary bg-primary/10 scale-110'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
        <input
          {...register('iconEmoji')}
          placeholder={t('form.iconCustom')}
          maxLength={4}
          className="w-20 text-center border border-border rounded-xl px-3 py-2 text-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* الاسم */}
      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="job-title">
          {t('form.title')} <span className="text-red-500" aria-hidden>*</span>
        </label>
        <input
          id="job-title"
          {...register('title')}
          placeholder={t('form.titlePlaceholder')}
          className={cn(
            'w-full border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]',
            errors.title ? 'border-red-500' : 'border-border'
          )}
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      {/* الوصف */}
      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="job-desc">
          {t('form.description')}
        </label>
        <textarea
          id="job-desc"
          {...register('description')}
          placeholder={t('form.descriptionPlaceholder')}
          rows={3}
          className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* المكافأة + الصعوبة */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="job-reward">
            {t('form.reward')} <span className="text-red-500" aria-hidden>*</span>
          </label>
          <div className="relative">
            <input
              id="job-reward"
              inputMode="decimal"
              dir="ltr"
              lang="en"
              {...register('reward', {
                setValueAs: (v) => parseFloat(convertToWesternDigits(String(v))) || 0,
              })}
              placeholder="5.00"
              className={cn(
                'w-full border rounded-xl ps-4 pe-12 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]',
                errors.reward ? 'border-red-500' : 'border-border'
              )}
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {tc('riyal')}
            </span>
          </div>
          {errors.reward && <p className="text-xs text-red-500 mt-1">{errors.reward.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('form.difficulty')}</label>
          <select
            {...register('difficulty')}
            className="w-full border border-border rounded-xl px-4 py-3 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>{t(`difficulty.${d.toLowerCase()}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* الوقت المقدر + الحد الأسبوعي */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="job-minutes">
            {t('form.estimatedMinutes')}
          </label>
          <input
            id="job-minutes"
            type="number"
            inputMode="numeric"
            dir="ltr"
            lang="en"
            min={1}
            {...register('estimatedMinutes', {
              setValueAs: (v) => (v === '' ? undefined : parseInt(convertToWesternDigits(String(v)), 10)),
            })}
            placeholder="15"
            className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="job-weekly">
            {t('form.weeklyLimit')}
          </label>
          <input
            id="job-weekly"
            type="number"
            inputMode="numeric"
            dir="ltr"
            lang="en"
            min={1}
            {...register('weeklyLimit', {
              setValueAs: (v) => (v === '' ? undefined : parseInt(convertToWesternDigits(String(v)), 10)),
            })}
            placeholder={t('form.weeklyLimitPlaceholder')}
            className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          />
        </div>
      </div>

      {/* الفئة + العمر */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="job-category">
            {t('form.category')}
          </label>
          <input
            id="job-category"
            {...register('category')}
            placeholder={t('form.categoryPlaceholder')}
            className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="job-minage">
            {t('form.minAge')}
          </label>
          <input
            id="job-minage"
            type="number"
            inputMode="numeric"
            dir="ltr"
            lang="en"
            min={4}
            max={18}
            {...register('minAge', {
              setValueAs: (v) => parseInt(convertToWesternDigits(String(v)), 10) || 4,
            })}
            className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
          />
        </div>
      </div>

      {/* أزرار */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-[52px] rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors"
        >
          {tc('cancel')}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 min-h-[52px] rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? tc('loading') : tc('save')}
        </button>
      </div>
    </form>
  );
}
