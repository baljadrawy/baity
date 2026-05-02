'use client';

/**
 * ArchivePageClient — واجهة الأرشيف العام
 *
 * - بحث + فلترة بالفئة + toggle expiringSoon
 * - grid responsive للبطاقات
 * - زر رفع وثيقة جديدة
 * - حذف مع confirm
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, AlertTriangle, X } from 'lucide-react';
import { useArchive, useDeleteArchive } from '@/features/archive/hooks/useArchive';
import { ArchiveCard } from '@/features/archive/components/ArchiveCard';
import { ArchiveUploadDialog } from '@/features/archive/components/ArchiveUploadDialog';
import { ARCHIVE_CATEGORIES, type ArchiveCategory } from '@/features/archive/schemas';
import type { ArchiveItemView } from '@/features/archive/api/repository';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { EmptyState } from '@/shared/ui/EmptyState';
import { cn } from '@/shared/lib/utils';

export function ArchivePageClient() {
  const t = useTranslations('archive');
  const tCat = useTranslations('archive.categories');
  const tc = useTranslations('common');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ArchiveCategory | undefined>();
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const { data, isLoading } = useArchive({ search, category, expiringSoon });
  const deleteMutation = useDeleteArchive();

  const items = data?.data ?? [];

  const handleDelete = async (item: ArchiveItemView) => {
    const confirmed = window.confirm(t('deleteConfirm', { name: item.title }));
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(item.id);
    } catch (err) {
      console.error('delete archive failed', err);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto pb-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth min-h-[44px] flex-shrink-0"
        >
          <Plus size={16} aria-hidden="true" />
          <span className="hidden sm:inline">{t('add')}</span>
        </button>
      </header>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full ps-9 pe-3 py-2.5 border border-border rounded-xl bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-smooth min-h-[44px]"
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
            'inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border text-sm font-medium transition-smooth',
            expiringSoon
              ? 'bg-warning/10 border-warning/40 text-warning'
              : 'border-border text-muted-foreground hover:bg-muted/50'
          )}
        >
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{t('expiringSoon')}</span>
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        <button
          onClick={() => setCategory(undefined)}
          className={cn(
            'flex-shrink-0 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-smooth min-h-[44px]',
            !category
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted'
          )}
        >
          {t('allCategories')}
        </button>
        {ARCHIVE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'flex-shrink-0 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-smooth min-h-[44px]',
              category === c
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted'
            )}
          >
            {tCat(c.toLowerCase() as 'invoice')}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon="🗂️" title={t('empty')} description={t('emptyHint')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {items.map((item) => (
            <ArchiveCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      <ArchiveUploadDialog open={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  );
}
