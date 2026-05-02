'use client';

/**
 * ApplianceMaintenanceSection — قسم جدولة صيانة الجهاز (داخل dialog التعديل)
 *
 * - عرض الجداول الحالية مع nextDueAt + intervalDays + lastDoneAt
 * - زر "تم تنفيذها" — يُنشئ MaintenanceLog ويحدّث nextDueAt
 * - حذف جدول
 * - نموذج بسيط لإضافة جدول جديد
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Plus, Wrench, CheckCircle2, Trash2, Calendar } from 'lucide-react';
import { useFormat } from '@/shared/hooks/useFormat';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import {
  useAddMaintenanceSchedule,
  useLogMaintenance,
  useDeleteMaintenanceSchedule,
} from '../hooks/useAppliances';
import type { ApplianceWithMeta } from '../api/repository';
import { cn } from '@/shared/lib/utils';

interface ApplianceMaintenanceSectionProps {
  appliance: ApplianceWithMeta;
}

export function ApplianceMaintenanceSection({ appliance }: ApplianceMaintenanceSectionProps) {
  const t = useTranslations('appliances');
  const tc = useTranslations('common');
  const f = useFormat();

  const [showAdd, setShowAdd] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [intervalDays, setIntervalDays] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addMutation = useAddMaintenanceSchedule(appliance.id);
  const logMutation = useLogMaintenance(appliance.id);
  const deleteMutation = useDeleteMaintenanceSchedule(appliance.id);

  const schedules = appliance.maintenanceSchedules.filter((s) => s.isActive);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const days = Number(convertToWesternDigits(intervalDays).replace(/\D/g, ''));
    if (!taskName.trim()) {
      setError(tc('required'));
      return;
    }
    if (!days || days < 1) {
      setError(t('errors.invalidInterval'));
      return;
    }

    const nextDueAt = new Date(Date.now() + days * 86400000);
    try {
      await addMutation.mutateAsync({
        taskName: taskName.trim(),
        intervalDays: days,
        nextDueAt,
        notifyBeforeDays: 7,
      });
      setTaskName('');
      setIntervalDays('');
      setShowAdd(false);
    } catch {
      setError(t('errors.addScheduleFailed'));
    }
  };

  const handleLog = async (scheduleId: string) => {
    try {
      await logMutation.mutateAsync({ scheduleId });
    } catch (err) {
      console.error('log maintenance failed', err);
    }
  };

  const handleDelete = async (scheduleId: string, name: string) => {
    const confirmed = window.confirm(t('deleteScheduleConfirm', { name }));
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(scheduleId);
    } catch (err) {
      console.error('delete schedule failed', err);
    }
  };

  return (
    <section className="flex flex-col gap-3 pt-4 border-t border-border">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
          <Wrench size={16} className="text-muted-foreground" aria-hidden="true" />
          {t('maintenanceHistory')}
          <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">
            ({f.number(schedules.length)})
          </span>
        </h3>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-muted/50 hover:bg-muted px-3 py-1.5 text-xs font-medium transition-smooth min-h-[44px]"
        >
          <Plus size={14} aria-hidden="true" />
          {t('addMaintenance')}
        </button>
      </header>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3"
        >
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder={t('maintenanceTask')}
            maxLength={200}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[44px]"
          />
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={intervalDays}
              onChange={(e) =>
                setIntervalDays(convertToWesternDigits(e.target.value).replace(/\D/g, ''))
              }
              placeholder={t('intervalDays')}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-smooth min-h-[44px] tabular-nums"
              style={{ fontFeatureSettings: '"lnum", "tnum"' }}
            />
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-smooth min-h-[44px]"
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {tc('save')}
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </form>
      )}

      {schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-3">
          {t('noMaintenance')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {schedules.map((s) => {
            const days = Math.round(
              (new Date(s.nextDueAt).getTime() - Date.now()) / 86400000
            );
            const isOverdue = days < 0;
            const isSoon = days >= 0 && days <= 7;

            return (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0',
                    isOverdue
                      ? 'bg-destructive/10 text-destructive'
                      : isSoon
                        ? 'bg-warning/10 text-warning'
                        : 'bg-info/10 text-info'
                  )}
                  aria-hidden="true"
                >
                  <Calendar size={16} strokeWidth={2.25} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.taskName}</p>
                  <p
                    className="text-xs text-muted-foreground mt-0.5 tabular-nums"
                    dir="ltr"
                    style={{ fontFeatureSettings: '"lnum", "tnum"' }}
                  >
                    {f.shortDate(s.nextDueAt)} · {f.number(s.intervalDays)} {tc('day') || 'day'}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLog(s.id)}
                    disabled={logMutation.isPending}
                    className="flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] text-muted-foreground hover:text-success hover:bg-success/10 transition-smooth disabled:opacity-50"
                    aria-label={t('logMaintenance')}
                  >
                    <CheckCircle2 size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id, s.taskName)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth disabled:opacity-50"
                    aria-label={tc('delete')}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
