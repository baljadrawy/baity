'use client';

/**
 * ExecuteChoreDialog — نافذة تسجيل تنفيذ مهمة
 * Sheet على الجوال، Dialog على الديسكتوب
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useExecuteChore } from '../hooks/useChores';
import { executeChoreSchema, type ExecuteChoreInput } from '../schemas';
import { useFormat } from '@/shared/hooks/useFormat';
import { cn } from '@/shared/lib/utils';
import type { ChoreWithMeta } from '../api/repository';

interface ExecuteChoreDialogProps {
  chore: ChoreWithMeta;
  onClose: () => void;
}

export function ExecuteChoreDialog({ chore, onClose }: ExecuteChoreDialogProps) {
  const t = useTranslations('chores');
  const tc = useTranslations('common');
  const f = useFormat();
  const [success, setSuccess] = useState(false);

  const executeChore = useExecuteChore(chore.id);

  const { register, handleSubmit, formState: { errors } } = useForm<ExecuteChoreInput>({
    resolver: zodResolver(executeChoreSchema),
    defaultValues: {
      executedAt: new Date(),
    },
  });

  const onSubmit = async (data: ExecuteChoreInput) => {
    await executeChore.mutateAsync(data);
    setSuccess(true);
    setTimeout(onClose, 1500);
  };

  const inputClass = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px]';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal
        aria-labelledby="execute-dialog-title"
        className={cn(
          'fixed z-50 bg-background shadow-xl',
          'bottom-0 inset-x-0 rounded-t-2xl',
          'md:inset-auto md:top-1/2 md:start-1/2',
          'md:-translate-y-1/2 md:-translate-x-1/2',
          'md:w-full md:max-w-md md:rounded-2xl'
        )}
      >
        {/* مقبض جوال */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 id="execute-dialog-title" className="text-lg font-semibold">
              {t('execute.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={tc('close')}
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
          </div>

          {/* اسم المهمة */}
          <div className="p-3 rounded-xl bg-muted mb-5">
            <p className="font-medium">{chore.name}</p>
            {chore.nextDueDate && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('nextDue')}: {f.date(chore.nextDueDate)}
              </p>
            )}
            {chore.pointsReward > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                ⭐ {t('pointsReward', { points: chore.pointsReward })}
              </p>
            )}
          </div>

          {/* حالة النجاح */}
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="text-base font-medium text-emerald-700 dark:text-emerald-400">
                {t('execute.success')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* تاريخ التنفيذ */}
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="exec-date">
                  {t('execute.date')}
                </label>
                <input
                  id="exec-date"
                  type="date"
                  lang="en"
                  dir="ltr"
                  className={inputClass}
                  defaultValue={new Date().toISOString().split('T')[0]}
                  {...register('executedAt')}
                />
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="exec-notes">
                  {tc('notes')}
                </label>
                <input
                  id="exec-notes"
                  type="text"
                  className={inputClass}
                  placeholder={t('execute.notesPlaceholder')}
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
                  disabled={executeChore.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors min-h-[52px]"
                >
                  {executeChore.isPending ? tc('loading') : t('execute.confirm')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
