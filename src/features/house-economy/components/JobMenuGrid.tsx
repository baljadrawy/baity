'use client';

/**
 * JobMenuGrid — شبكة منيو الأعمال
 *
 * واجهة الطفل: بطاقات كبيرة قابلة اللمس
 * Mobile-first: 1 عمود → 2 أعمدة على sm+ → 3 على lg+
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { useJobMenuItems, useStartJob } from '../hooks/useHouseEconomy';
import { JobCard } from './JobCard';
import type { JobMenuItemWithStats } from '../types';

interface JobMenuGridProps {
  childMemberId?: string;
  childAge?: number;
}

export function JobMenuGrid({ childMemberId, childAge }: JobMenuGridProps) {
  const t = useTranslations('houseEconomy');
  const tc = useTranslations('common');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data, isLoading } = useJobMenuItems({
    isActive: true,
    childId: childMemberId,
    search: search || undefined,
  });

  const startJob = useStartJob();

  const jobs = (data?.data ?? []) as JobMenuItemWithStats[];

  const categories = [...new Set(jobs.map((j) => j.category).filter(Boolean))] as string[];

  const filtered = selectedCategory
    ? jobs.filter((j) => j.category === selectedCategory)
    : jobs;

  const handleStart = (job: JobMenuItemWithStats) => {
    startJob.mutate({ jobMenuItemId: job.id });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* البحث والفلتر */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tc('search')}
            className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
            dir="rtl"
          />
        </div>

        {/* فلتر الفئة */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
                !selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {tc('filter')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* الشبكة */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <span className="text-4xl" aria-hidden>📋</span>
          <p className="mt-3 text-sm">{t('noJobsAvailable')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onStart={handleStart}
              childAge={childAge}
            />
          ))}
        </div>
      )}
    </div>
  );
}
