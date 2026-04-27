'use client';

/**
 * ChoreForm — نموذج إضافة وتعديل مهمة دورية
 *
 * يعرض حقول مختلفة حسب نوع التكرار المختار
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { createChoreSchema, type CreateChoreInput } from '../schemas';

interface ChoreFormProps {
  defaultValues?: Partial<CreateChoreInput>;
  onSubmit: (data: CreateChoreInput) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const PERIOD_TYPES = [
  'MANUALLY', 'DAILY', 'DYNAMIC_REGULAR', 'WEEKLY', 'MONTHLY', 'YEARLY',
] as const;

const ASSIGNMENT_TYPES = [
  'NO_ASSIGNMENT', 'WHO_LEAST_DID_IT_FIRST', 'RANDOM', 'IN_ALPHABETIC_ORDER', 'FIXED',
] as const;

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const WEEKDAY_NAMES_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function ChoreForm({ defaultValues, onSubmit, isLoading, submitLabel }: ChoreFormProps) {
  const t = useTranslations('chores');
  const tc = useTranslations('common');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateChoreInput>({
    resolver: zodResolver(createChoreSchema),
    defaultValues: {
      periodType: 'MONTHLY',
      assignmentType: 'NO_ASSIGNMENT',
      assignedMembers: [],
      pointsReward: 0,
      notifyBeforeDays: 1,
      dueDateRollover: true,
      trackDateOnly: false,
      ...defaultValues,
    },
  });

  const periodType = watch('periodType');
  const assignmentType = watch('assignmentType');

  const labelClass = 'block text-sm font-medium mb-1.5';
  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px]';
  const errorClass = 'text-xs text-red-600 dark:text-red-400 mt-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

      {/* اسم المهمة */}
      <div>
        <label className={labelClass} htmlFor="chore-name">
          {t('form.name')} <span className="text-red-500">*</span>
        </label>
        <input
          id="chore-name"
          type="text"
          className={inputClass}
          placeholder={t('form.namePlaceholder')}
          {...register('name')}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      {/* الوصف */}
      <div>
        <label className={labelClass} htmlFor="chore-desc">
          {t('form.description')}
        </label>
        <textarea
          id="chore-desc"
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder={t('form.descriptionPlaceholder')}
          {...register('description')}
        />
      </div>

      {/* نوع التكرار + الإعدادات المرتبطة به */}
      <div className="space-y-3">
        <div>
          <label className={labelClass} htmlFor="chore-period">
            {t('form.periodType')} <span className="text-red-500">*</span>
          </label>
          <select id="chore-period" className={inputClass} {...register('periodType')}>
            {PERIOD_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {t(`periodTypes.${pt.toLowerCase()}`, { days: 1 })}
              </option>
            ))}
          </select>
        </div>

        {/* عدد الأيام — DAILY أو DYNAMIC_REGULAR */}
        {(periodType === 'DAILY' || periodType === 'DYNAMIC_REGULAR') && (
          <div>
            <label className={labelClass} htmlFor="chore-days">
              {t('form.periodDays')} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="chore-days"
                type="number"
                inputMode="numeric"
                min="1"
                max="365"
                dir="ltr"
                lang="en"
                className={`${inputClass} w-28 text-center`}
                {...register('periodDays', { valueAsNumber: true })}
                aria-invalid={!!errors.periodDays}
              />
              <span className="text-sm text-muted-foreground">{t('form.days')}</span>
            </div>
            {errors.periodDays && <p className={errorClass}>{errors.periodDays.message}</p>}
          </div>
        )}

        {/* يوم الأسبوع — WEEKLY */}
        {periodType === 'WEEKLY' && (
          <div>
            <label className={labelClass} htmlFor="chore-weekday">
              {t('form.periodWeekDay')}
            </label>
            <select id="chore-weekday" className={inputClass} {...register('periodWeekDay', { valueAsNumber: true })}>
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>{WEEKDAY_NAMES_AR[d]}</option>
              ))}
            </select>
          </div>
        )}

        {/* يوم الشهر — MONTHLY */}
        {periodType === 'MONTHLY' && (
          <div>
            <label className={labelClass} htmlFor="chore-monthday">
              {t('form.periodMonthDay')}
            </label>
            <select id="chore-monthday" className={inputClass} {...register('periodMonthDay', { valueAsNumber: true })}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d} dir="ltr">{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* نوع الإسناد */}
      <div>
        <label className={labelClass} htmlFor="chore-assignment">
          {t('form.assignmentType')}
        </label>
        <select id="chore-assignment" className={inputClass} {...register('assignmentType')}>
          {ASSIGNMENT_TYPES.map((at) => (
            <option key={at} value={at}>
              {t(`assignmentTypes.${at.toLowerCase()}`)}
            </option>
          ))}
        </select>
        {assignmentType === 'WHO_LEAST_DID_IT_FIRST' && (
          <p className="text-xs text-muted-foreground mt-1">
            {t('form.assignmentLeastHint')}
          </p>
        )}
      </div>

      {/* نقاط المكافأة + التنبيه: صفين */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="chore-points">
            {t('form.pointsReward')}
          </label>
          <div className="relative">
            <input
              id="chore-points"
              type="number"
              inputMode="numeric"
              min="0"
              max="1000"
              dir="ltr"
              lang="en"
              className={inputClass}
              {...register('pointsReward', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="chore-notify">
            {t('form.notifyBeforeDays')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="chore-notify"
              type="number"
              inputMode="numeric"
              min="0"
              max="30"
              dir="ltr"
              lang="en"
              className={inputClass}
              {...register('notifyBeforeDays', { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* خيارات إضافية */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
          <input
            type="checkbox"
            className="w-5 h-5 rounded accent-primary"
            {...register('dueDateRollover')}
          />
          <div>
            <span className="text-sm font-medium block">{t('form.rollover')}</span>
            <span className="text-xs text-muted-foreground">{t('form.rolloverHint')}</span>
          </div>
        </label>
      </div>

      {/* زر الإرسال */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl text-sm font-semibold min-h-[52px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {isLoading ? tc('loading') : (submitLabel ?? tc('save'))}
      </button>
    </form>
  );
}
