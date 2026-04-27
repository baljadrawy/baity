'use client';

/**
 * ChoresPageClient — الجزء التفاعلي من صفحة المهام
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { ChoresList } from '@/features/chores/components/ChoresList';
import { ChoreForm } from '@/features/chores/components/ChoreForm';
import { useCreateChore } from '@/features/chores/hooks/useChores';
import { cn } from '@/shared/lib/utils';

export function ChoresPageClient() {
  const t = useTranslations('chores');
  const tc = useTranslations('common');
  const [showAddForm, setShowAddForm] = useState(false);
  const createChore = useCreateChore();

  const handleCreate = async (data: Parameters<typeof createChore.mutateAsync>[0]) => {
    await createChore.mutateAsync(data);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* نافذة الإضافة */}
      {showAddForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowAddForm(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal
            aria-labelledby="add-chore-title"
            className={cn(
              'fixed z-50 bg-background shadow-xl overflow-y-auto',
              'bottom-0 inset-x-0 rounded-t-2xl max-h-[92dvh]',
              'md:inset-auto md:top-1/2 md:start-1/2',
              'md:-translate-y-1/2 md:-translate-x-1/2',
              'md:w-full md:max-w-lg md:rounded-2xl md:max-h-[90dvh]'
            )}
          >
            <div className="md:hidden flex justify-center pt-3 pb-1 sticky top-0 bg-background">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 id="add-chore-title" className="text-lg font-semibold">{t('add')}</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={tc('close')}
                >
                  <X className="w-5 h-5" aria-hidden />
                </button>
              </div>

              <ChoreForm
                onSubmit={handleCreate}
                isLoading={createChore.isPending}
                submitLabel={t('addConfirm')}
              />
            </div>
          </div>
        </>
      )}

      <ChoresList onAdd={() => setShowAddForm(true)} />
    </div>
  );
}
