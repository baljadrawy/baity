'use client';

/**
 * AppliancesPageClient — صفحة الأجهزة المنزلية والضمانات
 *
 * Mobile-first، بحث + فلترة + إضافة/تعديل عبر Sheet
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, ShieldAlert, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAppliances, useCreateAppliance, useUpdateAppliance, useDeleteAppliance } from '@/features/appliances/hooks/useAppliances';
import { ApplianceCard } from '@/features/appliances/components/ApplianceCard';
import { ApplianceForm } from '@/features/appliances/components/ApplianceForm';
import { ApplianceDocumentsSection } from '@/features/appliances/components/ApplianceDocumentsSection';
import { ApplianceMaintenanceSection } from '@/features/appliances/components/ApplianceMaintenanceSection';
import type { ApplianceWithMeta } from '@/features/appliances/api/repository';
import type { CreateApplianceInput } from '@/features/appliances/schemas';

/**
 * Prisma يُرجع `null` للحقول الاختيارية، لكن schema الفورم يستخدم `undefined`.
 * هذه الدالة تُحوّل null → undefined لتُستخدم الكائن كـ defaultValues.
 */
function toFormDefaults(a: ApplianceWithMeta): Partial<CreateApplianceInput> {
  return Object.fromEntries(
    Object.entries(a).map(([k, v]) => [k, v === null ? undefined : v])
  ) as Partial<CreateApplianceInput>;
}

export function AppliancesPageClient() {
  const t = useTranslations('appliances');
  const tc = useTranslations('common');

  const [search, setSearch] = useState('');
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApplianceWithMeta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApplianceWithMeta | null>(null);

  const { data, isLoading } = useAppliances({ search, expiringSoon });
  const createMutation = useCreateAppliance();
  const updateMutation = useUpdateAppliance(editing?.id ?? '');
  const deleteMutation = useDeleteAppliance();

  const appliances = data?.data ?? [];

  function handleCreate(formData: CreateApplianceInput) {
    createMutation.mutate(formData, {
      onSuccess: () => setShowForm(false),
    });
  }

  function handleUpdate(formData: CreateApplianceInput) {
    if (!editing) return;
    updateMutation.mutate(formData, {
      onSuccess: () => setEditing(null),
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  function openEdit(appliance: ApplianceWithMeta) {
    setEditing(appliance);
    setShowForm(false);
  }

  const isFormOpen = showForm || !!editing;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">{t('add')}</span>
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full ps-9 pe-3 py-2.5 border border-border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={tc('clear')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setExpiringSoon((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border text-sm font-medium transition-colors',
              expiringSoon
                ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-400'
                : 'border-border text-muted-foreground hover:bg-muted'
            )}
          >
            <ShieldAlert className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">{t('showExpiring')}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4 pb-24">
        {isLoading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : appliances.length === 0 ? (
          /* Empty */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4" role="img" aria-label="">🏠</span>
            <p className="font-semibold text-lg mb-1">{t('empty')}</p>
            <p className="text-sm text-muted-foreground mb-6">{t('emptyHint')}</p>
            <button
              onClick={() => { setShowForm(true); setEditing(null); }}
              className="flex items-center gap-2 min-h-[48px] px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
            >
              <Plus className="w-4 h-4" aria-hidden />
              {t('add')}
            </button>
          </div>
        ) : (
          /* Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {appliances.map((appliance) => (
              <div key={appliance.id} className="relative group">
                <ApplianceCard appliance={appliance} onClick={openEdit} />
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(appliance); }}
                  className="absolute top-2 start-2 opacity-0 group-hover:opacity-100 focus:opacity-100 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 transition-all"
                  aria-label={tc('delete')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Form Sheet (Add / Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setShowForm(false); setEditing(null); }}
          />
          {/* Panel */}
          <div className="relative z-10 w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
              <h2 className="font-bold text-lg">{editing ? t('edit') : t('add')}</h2>
              <button
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
                aria-label={tc('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <ApplianceForm
                key={editing?.id ?? 'new'}
                defaultValues={editing ? toFormDefaults(editing) : undefined}
                onSubmit={editing ? handleUpdate : handleCreate}
                onCancel={() => { setShowForm(false); setEditing(null); }}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
              {editing && <ApplianceMaintenanceSection appliance={editing} />}
              {editing && <ApplianceDocumentsSection applianceId={editing.id} />}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm bg-background rounded-2xl shadow-2xl p-6 space-y-4">
            <p className="font-bold text-lg">{tc('confirm')}</p>
            <p className="text-sm text-muted-foreground">
              {tc('deletePrompt', { name: deleteTarget.name })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 min-h-[48px] rounded-xl border border-border font-medium text-sm hover:bg-muted transition-colors"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 min-h-[48px] rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? tc('loading') : tc('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
