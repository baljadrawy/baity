/**
 * RecentActivityWidget — آخر النشاطات في المنزل
 * Server Component — يدمج:
 * - BillPayment الأحدث (دفع فاتورة)
 * - ChoreExecution الأحدث (إنجاز مهمة)
 * - ShoppingItem الجديدة المُضافة
 *
 * top 6 sorted desc حسب التاريخ
 */

import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/core/db';
import { getServerSession } from '@/core/auth/server-session';
import { formatCurrency, formatRelativeTime } from '@/core/i18n/format-number';
import type { Locale } from '@/i18n/config';
import { ActivityItem, type ActivityKind } from '@/shared/ui/ActivityItem';
import { EmptyState } from '@/shared/ui/EmptyState';

interface ActivityEntry {
  id: string;
  message: string;
  date: Date;
  kind: ActivityKind;
  value?: string;
}

/** صياغة وقت نسبي ("قبل 3 ساعات") */
function relativeFromNow(date: Date, locale: Locale): string {
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  if (Math.abs(diffMin) < 60) return formatRelativeTime(diffMin, 'minute', locale);
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return formatRelativeTime(diffHr, 'hour', locale);
  const diffDay = Math.round(diffHr / 24);
  return formatRelativeTime(diffDay, 'day', locale);
}

export async function RecentActivityWidget() {
  const t = await getTranslations('dashboard.activity');
  const tEmpty = await getTranslations('dashboard');
  const locale = (await getLocale()) as Locale;
  const session = await getServerSession();
  if (!session) return null;

  const since = new Date(Date.now() - 30 * 86400000);

  const [payments, executions, shoppingItems] = await Promise.all([
    prisma.billPayment.findMany({
      where: {
        paidAt: { gte: since },
        bill: { householdId: session.householdId, deletedAt: null },
      },
      orderBy: { paidAt: 'desc' },
      take: 6,
      select: {
        id: true,
        amount: true,
        paidAt: true,
        bill: { select: { title: true } },
      },
    }),
    prisma.choreExecution.findMany({
      where: {
        executedAt: { gte: since },
        chore: { householdId: session.householdId, deletedAt: null },
      },
      orderBy: { executedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        executedAt: true,
        chore: { select: { name: true } },
        executedById: true,
      },
    }),
    prisma.shoppingItem.findMany({
      where: {
        createdAt: { gte: since },
        list: { householdId: session.householdId, deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  // جلب أسماء أعضاء الـ executions
  const memberIds = Array.from(new Set(executions.map((e) => e.executedById)));
  const memberNames = new Map<string, string>();
  if (memberIds.length > 0) {
    const members = await prisma.householdMember.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, user: { select: { name: true } } },
    });
    for (const m of members) memberNames.set(m.id, m.user.name);
  }

  const entries: ActivityEntry[] = [];

  for (const p of payments) {
    entries.push({
      id: `pay-${p.id}`,
      message: t('billPaid', { title: p.bill.title }),
      date: new Date(p.paidAt),
      kind: 'bill_paid',
      value: formatCurrency(Number(p.amount), locale),
    });
  }

  for (const e of executions) {
    const member = memberNames.get(e.executedById) ?? '—';
    entries.push({
      id: `exec-${e.id}`,
      message: t('choreDone', { member, title: e.chore.name }),
      date: new Date(e.executedAt),
      kind: 'chore_done',
    });
  }

  for (const s of shoppingItems) {
    entries.push({
      id: `shop-${s.id}`,
      message: t('shoppingAdded', { title: s.name }),
      date: new Date(s.createdAt),
      kind: 'shopping_added',
    });
  }

  entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  const top = entries.slice(0, 6);

  if (top.length === 0) {
    return <EmptyState icon="🌙" title={tEmpty('noActivity')} />;
  }

  return (
    <ul className="flex flex-col divide-y divide-border" role="list">
      {top.map((e) => (
        <ActivityItem
          key={e.id}
          message={e.message}
          time={relativeFromNow(e.date, locale)}
          kind={e.kind}
          value={e.value}
        />
      ))}
    </ul>
  );
}
