'use client';

/**
 * ShoppingListDetail — تفاصيل قائمة مشتريات
 *
 * عرض + إضافة + تأشير العناصر
 * Mobile-first
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormat } from '@/shared/hooks/useFormat';
import { Plus, CheckCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { convertToWesternDigits } from '@/core/i18n/format-number';
import {
  useShoppingList,
  useAddShoppingItem,
  useCheckShoppingItem,
  useDeleteShoppingItem,
  useCheckAllItems,
} from '../hooks/useShopping';
import { ShoppingItemRow } from './ShoppingItemRow';
import { PageLoader } from '@/shared/components/PageLoader';

const URGENCY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW'] as const;

interface Props {
  listId: string;
  onBack?: () => void;
}

export function ShoppingListDetail({ listId, onBack }: Props) {
  const t = useTranslations('shopping');
  const tc = useTranslations('common');
  const f = useFormat();

  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemUrgency, setNewItemUrgency] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [showAddForm, setShowAddForm] = useState(false);

  const { data, isLoading } = useShoppingList(listId);
  const addItem = useAddShoppingItem(listId);
  const checkItem = useCheckShoppingItem(listId);
  const deleteItem = useDeleteShoppingItem(listId);
  const checkAll = useCheckAllItems(listId);

  const list = data?.data;

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    addItem.mutate(
      {
        name: newItemName.trim(),
        estimatedPrice: newItemPrice
          ? parseFloat(convertToWesternDigits(newItemPrice)) || undefined
          : undefined,
        urgency: newItemUrgency,
      },
      {
        onSuccess: () => {
          setNewItemName('');
          setNewItemPrice('');
          setShowAddForm(false);
        },
      }
    );
  };

  if (isLoading) return <PageLoader />;
  if (!list) return null;

  const uncheckedItems = list.items.filter((i) => !i.isChecked);
  const checkedItems = list.items.filter((i) => i.isChecked);

  return (
    <div className="space-y-4">
      {/* رأس الصفحة */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
            aria-label={tc('back')}
          >
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-lg truncate">{list.name}</h2>
          <p className="text-xs text-muted-foreground">
            {f.number(list.checkedItems)}/{f.number(list.totalItems)} {t('items')}
          </p>
        </div>

        {/* شراء الكل */}
        {uncheckedItems.length > 0 && (
          <button
            type="button"
            onClick={() => checkAll.mutate()}
            disabled={checkAll.isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors min-h-[44px]"
          >
            <CheckCheck className="w-4 h-4" aria-hidden />
            {t('checkAll')}
          </button>
        )}
      </div>

      {/* شريط التقدم */}
      {list.totalItems > 0 && (
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{t('progress')}</span>
            <span dir="ltr">{f.number(list.completionRate)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className={cn(
                'h-2.5 rounded-full transition-all duration-500',
                list.completionRate === 100 ? 'bg-emerald-500' : 'bg-primary'
              )}
              style={{ width: `${list.completionRate}%` }}
            />
          </div>
          {list.estimatedTotal > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {t('estimatedTotal')}{' '}
              <span className="font-medium text-foreground" dir="ltr">
                {f.currency(list.estimatedTotal)}
              </span>
            </p>
          )}
        </div>
      )}

      {/* قائمة العناصر غير المؤشرة */}
      {uncheckedItems.length > 0 && (
        <section className="bg-card border border-border rounded-2xl px-4">
          {uncheckedItems.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onToggle={(id, checked) => checkItem.mutate({ itemId: id, isChecked: checked })}
              onDelete={(id) => deleteItem.mutate(id)}
            />
          ))}
        </section>
      )}

      {/* إضافة عنصر */}
      {showAddForm ? (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={t('itemNamePlaceholder')}
            autoFocus
            className="w-full border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
            dir="rtl"
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />

          <div className="flex gap-3">
            <input
              type="text"
              inputMode="decimal"
              dir="ltr"
              lang="en"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              placeholder={t('pricePlaceholder')}
              className="flex-1 border border-border rounded-xl px-4 py-3 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
            />

            <select
              value={newItemUrgency}
              onChange={(e) => setNewItemUrgency(e.target.value as typeof newItemUrgency)}
              className="border border-border rounded-xl px-3 py-3 bg-background text-sm focus:outline-none min-h-[44px]"
            >
              {URGENCY_OPTIONS.map((u) => (
                <option key={u} value={u}>{t(`urgency.${u.toLowerCase()}`)}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 min-h-[44px] rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              {tc('cancel')}
            </button>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newItemName.trim() || addItem.isPending}
              className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {tc('add')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" aria-hidden />
          {t('addItem')}
        </button>
      )}

      {/* العناصر المشتراة */}
      {checkedItems.length > 0 && (
        <section>
          <p className="text-xs text-muted-foreground mb-2 px-1">{t('checkedItems', { count: checkedItems.length })}</p>
          <div className="bg-card border border-border rounded-2xl px-4 opacity-70">
            {checkedItems.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={(id, checked) => checkItem.mutate({ itemId: id, isChecked: checked })}
                onDelete={(id) => deleteItem.mutate(id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
