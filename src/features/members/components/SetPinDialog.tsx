'use client';

/**
 * SetPinDialog — حوار تعيين/تغيير PIN لطفل
 * 4 أرقام، يُحوَّل من الهندية/الفارسية تلقائياً
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, KeyRound } from 'lucide-react';
import { ResponsiveDialog } from '@/shared/components/ResponsiveDialog';
import { useSetMemberPin } from '../hooks/useMembers';
import type { MemberView } from '../api/repository';
import { convertToWesternDigits } from '@/core/i18n/format-number';

interface SetPinDialogProps {
  open: boolean;
  member: MemberView | null;
  onClose: () => void;
}

export function SetPinDialog({ open, member, onClose }: SetPinDialogProps) {
  const t = useTranslations('members');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const setPinMutation = useSetMemberPin(member?.id ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = convertToWesternDigits(pin).replace(/\D/g, '');
    if (!/^\d{4}$/.test(clean)) {
      setError(t('errors.invalidPin'));
      return;
    }
    if (!member) return;
    try {
      await setPinMutation.mutateAsync({ pin: clean });
      setPin('');
      onClose();
    } catch (err) {
      setError(t('errors.pinFailed'));
      console.error(err);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setPin('');
          setError(null);
          onClose();
        }
      }}
      title={t('setPinTitle', { name: member?.name ?? '' })}
      description={t('setPinDesc')}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="pin-input" className="block text-sm font-medium text-foreground mb-2">
            {t('form.pin')}
          </label>
          <input
            id="pin-input"
            type="password"
            inputMode="numeric"
            dir="ltr"
            maxLength={4}
            autoComplete="new-password"
            value={pin}
            onChange={(e) => setPin(convertToWesternDigits(e.target.value).replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full text-center text-2xl tracking-[0.5em] rounded-xl border border-border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[56px]"
            style={{ fontFeatureSettings: '"lnum", "tnum"' }}
          />
          <p className="text-xs text-muted-foreground mt-1.5">{t('form.pinHint')}</p>
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={setPinMutation.isPending || pin.length !== 4}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-smooth min-h-[48px]"
        >
          {setPinMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          )}
          {t('savePin')}
        </button>
      </form>
    </ResponsiveDialog>
  );
}
