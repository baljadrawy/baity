/**
 * ShoppingWidget — أهم عناصر المشتريات (غير المشتراة)
 * Server Component — Prisma query مباشرة
 */

import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/core/db';
import { getServerSession } from '@/core/auth/server-session';
import { EmptyState } from '@/shared/ui/EmptyState';

export async function ShoppingWidget() {
  const t = await getTranslations('shopping');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();

  const session = await getServerSession();
  if (!session) return null;

  // أهم 6 عناصر غير مشتراة مرتبة: HIGH أولاً ثم MEDIUM ثم LOW
  const items = await prisma.shoppingItem.findMany({
    where: {
      shoppingList: {
        householdId: session.householdId,
        deletedAt: null,
      },
      isChecked: false,
    },
    orderBy: [{ urgency: 'asc' }, { createdAt: 'asc' }],
    take: 6,
    select: {
      id: true,
      name: true,
      quantity: true,
      unit: true,
      urgency: true,
    },
  });

  if (items.length === 0) {
    return <EmptyState icon="🛒" title={t('emptyList')} />;
  }

  const urgentItems = items.filter((i) => i.urgency === 'HIGH');

  return (
    <div className="flex flex-col gap-2">
      {urgentItems.length > 0 && (
        <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
          {t('urgent')} ({urgentItems.length})
        </p>
      )}
      <ul className="flex flex-col gap-1.5" role="list">
        {items.slice(0, 5).map((item) => (
          <li key={item.id}>
            <Link
              href={`/${locale}/shopping`}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 hover:shadow-sm transition-shadow"
            >
              <span
                className={[
                  'h-2 w-2 rounded-full flex-shrink-0',
                  item.urgency === 'HIGH'
                    ? 'bg-destructive'
                    : item.urgency === 'MEDIUM'
                    ? 'bg-amber-400'
                    : 'bg-border',
                ].join(' ')}
                aria-hidden="true"
              />
              <span className="flex-1 text-sm text-foreground truncate">{item.name}</span>
              {item.quantity && (
                <span className="text-xs text-muted-foreground" dir="ltr">
                  x{item.quantity}{item.unit ? ` ${item.unit}` : ''}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {items.length > 5 && (
        <p className="text-xs text-muted-foreground text-center">
          {tCommon('andMore', { count: items.length - 5 })}
        </p>
      )}
    </div>
  );
}
