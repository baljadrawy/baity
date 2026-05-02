'use client';

/**
 * MemberForm — نموذج إضافة عضو جديد للمنزل
 *
 * - react-hook-form + Zod
 * - كل النصوص من i18n
 * - تحويل الأرقام الهندية تلقائياً
 * - Mobile-first (عمود واحد على الجوال، عمودان على md+)
 * - PIN حقل ديناميكي يظهر فقط عند اختيار CHILD
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2, UserPlus } from 'lucide-react';
import { createMemberSchema, type CreateMemberInput } from '../schemas';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import { HelpTooltip } from '@/shared/ui/HelpTooltip';

interface MemberFormProps {
  onSubmit: (data: CreateMemberInput) => void;
  isLoading?: boolean;
  serverError?: string | null;
}

export function MemberForm({ onSubmit, isLoading, serverError }: MemberFormProps) {
  const t = useTranslations('members');
  const tc = useTranslations('common');
  const tHelp = useTranslations('help.tooltips');

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      role: 'MEMBER',
    },
  });

  const role = watch('role');
  const isChild = role === 'CHILD';

  const labelClass = 'block text-sm font-medium text-foreground mb-1.5';
  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[44px]';
  const errorClass = 'text-xs text-destructive mt-1';
  const helpClass = 'text-xs text-muted-foreground mt-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* الاسم */}
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="member-name">
            {t('form.name')} <span className="text-destructive">*</span>
          </label>
          <input
            id="member-name"
            type="text"
            className={inputClass}
            placeholder={t('form.namePlaceholder')}
            autoComplete="name"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className={errorClass}>{tc('required')}</p>}
        </div>

        {/* الجوال */}
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="member-phone">
            {t('form.phone')} <span className="text-destructive">*</span>
          </label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <input
                id="member-phone"
                type="tel"
                inputMode="numeric"
                dir="ltr"
                className={inputClass}
                placeholder="05XXXXXXXX"
                autoComplete="tel"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(convertToWesternDigits(e.target.value))}
                aria-invalid={!!errors.phone}
              />
            )}
          />
          <p className={helpClass}>{t('form.phoneHint')}</p>
          {errors.phone && <p className={errorClass}>{t('errors.invalidPhone')}</p>}
        </div>

        {/* الدور */}
        <div>
          <label className={labelClass} htmlFor="member-role">
            {t('form.role')} <span className="text-destructive">*</span>
            <HelpTooltip
              text={tHelp('memberRole')}
              ariaLabel={tHelp('memberRole')}
              className="ms-1.5 align-middle"
            />
          </label>
          <select
            id="member-role"
            className={inputClass}
            {...register('role')}
            aria-invalid={!!errors.role}
          >
            <option value="ADMIN">{t('roles.admin')}</option>
            <option value="MEMBER">{t('roles.member')}</option>
            <option value="CHILD">{t('roles.child')}</option>
          </select>
          <p className={helpClass}>
            {role === 'ADMIN'
              ? t('roles.adminHint')
              : role === 'CHILD'
                ? t('roles.childHint')
                : t('roles.memberHint')}
          </p>
        </div>

        {/* العمر — مطلوب للطفل */}
        <div>
          <label className={labelClass} htmlFor="member-age">
            {t('form.age')}
            {isChild && <span className="text-destructive"> *</span>}
            {isChild && (
              <HelpTooltip
                text={tHelp('childAge')}
                ariaLabel={tHelp('childAge')}
                className="ms-1.5 align-middle"
              />
            )}
          </label>
          <Controller
            name="age"
            control={control}
            render={({ field }) => (
              <input
                id="member-age"
                type="text"
                inputMode="numeric"
                dir="ltr"
                className={inputClass}
                placeholder={isChild ? '4-17' : '18+'}
                value={field.value ?? ''}
                onChange={(e) => {
                  const v = convertToWesternDigits(e.target.value).replace(/\D/g, '');
                  field.onChange(v ? Number(v) : undefined);
                }}
                aria-invalid={!!errors.age}
              />
            )}
          />
          {errors.age && (
            <p className={errorClass}>
              {errors.age.message === 'invalid_child_age'
                ? t('errors.invalidChildAge')
                : errors.age.message === 'age_required_for_child'
                  ? t('errors.ageRequired')
                  : tc('required')}
            </p>
          )}
        </div>

        {/* PIN — للأطفال فقط */}
        {isChild && (
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="member-pin">
              {t('form.pin')} <span className="text-destructive">*</span>
              <HelpTooltip
                text={tHelp('childPin')}
                ariaLabel={tHelp('childPin')}
                className="ms-1.5 align-middle"
              />
            </label>
            <Controller
              name="pin"
              control={control}
              render={({ field }) => (
                <input
                  id="member-pin"
                  type="password"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={4}
                  className={inputClass}
                  placeholder="••••"
                  autoComplete="new-password"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(convertToWesternDigits(e.target.value).replace(/\D/g, ''))
                  }
                  aria-invalid={!!errors.pin}
                />
              )}
            />
            <p className={helpClass}>{t('form.pinHint')}</p>
            {errors.pin && <p className={errorClass}>{t('errors.invalidPin')}</p>}
          </div>
        )}
      </div>

      {serverError && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-smooth min-h-[44px]"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          {t('addConfirm')}
        </button>
      </div>
    </form>
  );
}
