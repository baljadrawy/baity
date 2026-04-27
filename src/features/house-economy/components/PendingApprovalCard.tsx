'use client';

/**
 * PendingApprovalCard — بطاقة طلب موافقة ولي الأمر
 *
 * تعرض: صورة الطفل (placeholder حرف)، اسم العمل، المبلغ المقترح
 * زران: وافق / ارفض — touch targets ≥ 44px
 */

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useFormat } from '@/shared/hooks/useFormat';
import { CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react';
import { useApproveJob, useRejectJob } from '../hooks/useHouseEconomy';

export interface PendingInstance {
  id: string;
  jobMenuItem: { title: string; iconEmoji: string | null; reward: unknown };
  child: { user: { name: string } };
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  completedAt: string | null;
}

interface PendingApprovalCardProps {
  instance: PendingInstance;
}

export function PendingApprovalCard({ instance }: PendingApprovalCardProps) {
  const t = useTranslations('houseEconomy');
  const f = useFormat();
  const [note, setNote] = useState('');

  const approve = useApproveJob(instance.id);
  const reject = useRejectJob(instance.id);

  const reward = Number(instance.jobMenuItem.reward);

  const handleApprove = () => {
    approve.mutate({ approvedAmount: reward, bonusAmount: 0, parentNotes: note || undefined });
  };

  const handleReject = () => {
    reject.mutate({ parentNotes: note || undefined });
  };

  const isPending = approve.isPending || reject.isPending;

  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* رأس البطاقة */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <span className="text-3xl" aria-hidden>
          {instance.jobMenuItem.iconEmoji ?? '📋'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{instance.jobMenuItem.title}</p>
          <p className="text-xs text-muted-foreground">{instance.child.user.name}</p>
        </div>
        <div className="text-end">
          <p className="text-xs text-muted-foreground">{t('reward')}</p>
          <p className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums" dir="ltr">
            {f.currency(reward)}
          </p>
        </div>
      </div>

      {/* الصور */}
      {(instance.beforePhotoUrl || instance.afterPhotoUrl) && (
        <div className="grid grid-cols-2 gap-2 p-4 pb-2">
          {(['beforePhotoUrl', 'afterPhotoUrl'] as const).map((key) => (
            <div key={key} className="aspect-square rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              {instance[key] ? (
                <Image
                  src={instance[key]!}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ملاحظة الوالد */}
      <div className="px-4 pb-3">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('parentView.noteForChild')}
          rows={2}
          className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          dir="rtl"
        />
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex gap-2 p-4 pt-0">
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="flex-1 min-h-[52px] flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          {t('parentView.reject')}
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={isPending}
          className="flex-1 min-h-[52px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          {t('parentView.approve')}
        </button>
      </div>
    </article>
  );
}
