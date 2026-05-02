'use client';

/**
 * SavingsGoalDialog — حوار إنشاء/تعديل هدف ادخار للطفل
 *
 * يدعم وضعين: create (مع goal=null) و edit (مع goal موجود)
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Target } from 'lucide-react';
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import {
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
} from '../hooks/useHouseEconomy';

interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: string | number;
  imageUrl?: string | null;
}

interface SavingsGoalDialogProps {
  open: boolean;
  onClose: () => void;
  memberId: string;
  /** الهدف للتعديل — null للإنشاء */
  goal: SavingsGoal | null;
}

export function SavingsGoalDialog({
  open,
  onClose,
  memberId,
  goal,
}: SavingsGoalDialogProps) {
  const t = useTranslations('wallet');
  const tc = useTranslations('common');

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateSavingsGoal(memberId);
  const updateMutation = useUpdateSavingsGoal(memberId, goal?.id ?? '');

  const isEdit = !!goal;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // إعادة تعبئة الـ form عند تغيّر الـ goal
  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTarget(String(goal.targetAmount));
    } else {
      setTitle('');
      setTarget('');
    }
    setError(null);
  }, [goal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTarget = convertToWesternDigits(target).replace(/\D/g, '');
    const targetNum = Number(cleanTarget);
    if (!title.trim()) {
      setError(tc('required'));
      return;
    }
    if (!targetNum || targetNum < 1) {
      setError(t('errors.invalidTarget'));
      return;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          title: title.trim(),
          targetAmount: targetNum,
        });
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          targetAmount: targetNum,
        });
      }
      onClose();
    } catch {
      setError(t('errors.saveFailed'));
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={isEdit ? t('editGoal') : t('addGoal')}
      description={isEdit ? undefined : t('addGoalDesc')}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="goal-title"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {t('goalTitle')}
          </label>
          <input
            id="goal-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('goalTitlePlaceholder')}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[44px]"
            maxLength={100}
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="goal-target"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {t('goalTarget')}
          </label>
          <input
            id="goal-target"
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={target}
            onChange={(e) =>
              setTarget(convertToWesternDigits(e.target.value).replace(/\D/g, ''))
            }
            placeholder="100"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[44px] tabular-nums"
            style={{ fontFeatureSettings: '"lnum", "tnum"' }}
          />
          <p className="text-xs text-muted-foreground mt-1">{t('goalTargetHint')}</p>
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 border border-destructive/30 p-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-smooth min-h-[48px]"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Target className="h-4 w-4" aria-hidden="true" />
          )}
          {tc('save')}
        </button>
      </form>
    </ResponsiveDialog>
  );
}
