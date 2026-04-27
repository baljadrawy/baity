'use client';

/**
 * ChoresList — قائمة المهام الدورية مع فلترة وتنفيذ
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { useChores, useDeleteChore } from '../hooks/useChores';
import { ChoreCard } from './ChoreCard';
import { ExecuteChoreDialog } from './ExecuteChoreDialog';
import type { ChoreWithMeta } from '../api/repository';

interface ChoresListProps {
  onAdd?: () => void;
}

export function ChoresList({ onAdd }: ChoresListProps) {
  const t = useTranslations('chores');
  const tc = useTranslations('common');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [executingChore, setExecutingChore] = useState<ChoreWithMeta | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useChores({ search: search || undefined, page, limit: 20 });
  const deleteChore = useDeleteChore();

  const chores = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  // فصل المهام: متأخرة + اليوم + قادمة
  const overdue = chores.filter((c) => c.isOverdue);
  const dueToday = chores.filter((c) => !c.isOverdue && c.daysUntilDue === 0);
  const upcoming = chores.filter((c) => !c.isOverdue && c.daysUntilDue !== 0);

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-sm mb-3">{tc('error')}</p>
        <button onClick={() => refetch()} className="text-primary text-sm underline underline-offset-2">
          {tc('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* شريط البحث */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            className="w-full ps-9 pe-3 py-2.5 text-sm rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[44px]"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label={tc('search')}
          />
        </div>

        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden />
            {t('add')}
          </button>
        )}
      </div>

      {/* مؤشر التحميل */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? tc('loading') : t('resultsCount', { count: total })}
        </p>
        {isFetching && !isLoading && (
          <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" aria-hidden />
        )}
      </div>

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* فارغ */}
      {!isLoading && chores.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3" aria-hidden>✅</p>
          <p className="font-medium">{t('allDone')}</p>
          <p className="text-muted-foreground text-sm mt-1">{t('allDoneDesc')}</p>
          {onAdd && (
            <button onClick={onAdd} className="mt-4 text-primary text-sm underline underline-offset-2">
              {t('addFirst')}
            </button>
          )}
        </div>
      )}

      {/* المتأخرة */}
      {!isLoading && overdue.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
            <span aria-hidden>⚠️</span>
            {t('overdueSection', { count: overdue.length })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {overdue.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                onExecute={() => setExecutingChore(chore)}
                onEdit={() => {/* TODO */}}
              />
            ))}
          </div>
        </section>
      )}

      {/* مهام اليوم */}
      {!isLoading && dueToday.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
            <span aria-hidden>📅</span>
            {t('todaySection', { count: dueToday.length })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dueToday.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                onExecute={() => setExecutingChore(chore)}
                onEdit={() => {/* TODO */}}
              />
            ))}
          </div>
        </section>
      )}

      {/* القادمة */}
      {!isLoading && upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {t('upcomingSection')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcoming.map((chore) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                onExecute={() => setExecutingChore(chore)}
                onEdit={() => {/* TODO */}}
              />
            ))}
          </div>
        </section>
      )}

      {/* ترقيم الصفحات */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-40 min-h-[44px]"
          >
            {tc('previous')}
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground" dir="ltr">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted disabled:opacity-40 min-h-[44px]"
          >
            {tc('next')}
          </button>
        </div>
      )}

      {/* نافذة التنفيذ */}
      {executingChore && (
        <ExecuteChoreDialog
          chore={executingChore}
          onClose={() => setExecutingChore(null)}
        />
      )}
    </div>
  );
}
