'use client';

/**
 * ShoppingPageClient — صفحة المشتريات
 *
 * قائمة القوائم → تفاصيل قائمة واحدة (نافذة منزلقة على الجوال)
 * Mobile-first
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { useShoppingLists, useCreateShoppingList, useDeleteShoppingList } from '@/features/shopping/hooks/useShopping';
import { ShoppingListCard } from '@/features/shopping/components/ShoppingListCard';
import { ShoppingListDetail } from '@/features/shopping/components/ShoppingListDetail';
import { PageLoader } from '@/shared/components/PageLoader';
import type { ShoppingListWithMeta } from '@/features/shopping/types';

export function ShoppingPageClient() {
  const t = useTranslations('shopping');
  const tc = useTranslations('common');

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useShoppingLists({ search: search || undefined });
  const createList = useCreateShoppingList();
  const deleteList = useDeleteShoppingList();

  const lists = data?.data ?? [];

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    createList.mutate(
      { name: newListName.trim(), isShared: true },
      {
        onSuccess: (data) => {
          const res = data as { data?: { id?: string } } | undefined;
          setNewListName('');
          setShowNewListForm(false);
          setSelectedListId(res?.data?.id ?? null);
        },
      }
    );
  };

  // وضع التفاصيل
  if (selectedListId) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl py-6">
        <ShoppingListDetail
          listId={selectedListId}
          onBack={() => setSelectedListId(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-6 space-y-6">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{t('title')}</h1>
        <button
          type="button"
          onClick={() => setShowNewListForm(true)}
          className="flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden />
          <span className="hidden sm:inline">{t('addList')}</span>
        </button>
      </div>

      {/* نموذج قائمة جديدة */}
      {showNewListForm && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder={t('listNamePlaceholder')}
            autoFocus
            className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
            dir="rtl"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNewListForm(false)}
              className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={handleCreateList}
              disabled={!newListName.trim() || createList.isPending}
              className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createList.isPending ? tc('loading') : tc('save')}
            </button>
          </div>
        </div>
      )}

      {/* بحث */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="w-full border border-border rounded-xl px-4 py-3 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
        dir="rtl"
      />

      {/* القوائم */}
      {isLoading ? (
        <PageLoader />
      ) : lists.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <span className="text-5xl" aria-hidden>🛒</span>
          <p className="mt-4 font-medium">{t('empty')}</p>
          <p className="text-sm mt-1">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list: ShoppingListWithMeta) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onClick={(l) => setSelectedListId(l.id)}
              onDelete={(id) => deleteList.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
