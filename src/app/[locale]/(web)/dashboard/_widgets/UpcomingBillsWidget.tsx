/**
 * UpcomingBillsWidget — الفواتير القادمة (خلال 14 يوم)
 * Server Component — Prisma query مباشرة
 */

import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/core/db';
import { getServerSession } from '@/core/auth/server-session';
import { EmptyState } from '@/shared/ui/EmptyState';

const CATEGORY_ICONS: Record<string, string> = {
  ELECTRICITY: '💡',
  WATER: '💧',
  TELECOM: '📱',
  INTERNET: '📡',
  SUBSCRIPTION: '🎬',
  RENT: '🏠',
  INSURANCE: '🛡️',
  OTHER: '📄',
};

export async function UpcomingBillsWidget() {
  const t = await getTranslations('bills');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();

  const session = await getServerSession();
  if (!session) return null;

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 86400000);

  const bills = await prisma.bill.findMany({
    where: {
      householdId: session.householdId,
      deletedAt: null,
      status: { in: ['PENDING', 'DUE', 'OVERDUE'] },
      dueDate: { lte: in14Days },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
    select: { id: true, title: true, amount: true, dueDate: true, category: true },
  });

  if (bills.length === 0) {
    return <EmptyState icon="💳" title={t('noBills')} description={t('noBillsDesc')} />;
  }

  return (
    <ul className="flex flex-col gap-2" role="list">
      {bills.map((bill) => {
        const daysLeft = Math.round(
          (new Date(bill.dueDate).getTime() - now.getTime()) / 86400000
        );
        const isOverdue = daysLeft < 0;
        const icon = CATEGORY_ICONS[bill.category] ?? '📄';

        return (
          <li key={bill.id}>
            <Link
              href={`/${locale}/bills`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow"
            >
              <span className="text-2xl flex-shrink-0" aria-hidden="true">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{bill.title}</p>
                <p className={`text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {isOverdue
                    ? tCommon('overdueBy', { days: Math.abs(daysLeft) })
                    : daysLeft === 0
                    ? tCommon('today')
                    : tCommon('daysLeft', { count: daysLeft })}
                </p>
              </div>
              <div className="flex-shrink-0 text-end">
                <p className="text-sm font-bold text-foreground" dir="ltr">
                  {Number(bill.amount).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">{tCommon('riyal')}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
