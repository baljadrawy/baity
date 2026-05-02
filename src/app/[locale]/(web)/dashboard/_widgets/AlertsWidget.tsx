/**
 * AlertsWidget — قائمة التنبيهات الحرجة
 * Server Component — يدمج:
 * - الفواتير المتأخرة (critical)
 * - الفواتير المستحقة خلال 3 أيام (warning)
 * - المهام المتأخرة (warning)
 * - الضمانات التي تنتهي خلال 30 يوم (info)
 * Top 5 sorted by severity ثم بالتاريخ
 */

import { getTranslations, getLocale } from 'next-intl/server';
import { CheckCircle2 } from 'lucide-react';
import { prisma } from '@/core/db';
import { getServerSession } from '@/core/auth/server-session';
import { formatCurrency } from '@/core/i18n/format-number';
import type { Locale } from '@/i18n/config';
import { AlertItem, type AlertSeverity, type AlertKind } from '@/shared/ui/AlertItem';

interface AlertEntry {
  id: string;
  message: string;
  meta?: string;
  severity: AlertSeverity;
  kind: AlertKind;
  href: string;
  /** للترتيب */
  rank: number;
  date: Date;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export async function AlertsWidget() {
  const t = await getTranslations('dashboard.alerts');
  const locale = (await getLocale()) as Locale;
  const session = await getServerSession();
  if (!session) return null;

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 86400000);
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const [overdueBills, dueSoonBills, overdueChores, expiringWarranties] = await Promise.all([
    prisma.bill.findMany({
      where: {
        householdId: session.householdId,
        deletedAt: null,
        status: { in: ['PENDING', 'DUE', 'OVERDUE'] },
        dueDate: { lt: now },
      },
      select: { id: true, title: true, amount: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    prisma.bill.findMany({
      where: {
        householdId: session.householdId,
        deletedAt: null,
        status: { in: ['PENDING', 'DUE'] },
        dueDate: { gte: now, lte: in3Days },
      },
      select: { id: true, title: true, amount: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    prisma.chore.findMany({
      where: {
        householdId: session.householdId,
        deletedAt: null,
        isActive: true,
        nextDueDate: { lt: now },
      },
      select: { id: true, name: true, nextDueDate: true },
      orderBy: { nextDueDate: 'asc' },
      take: 5,
    }),
    prisma.appliance.findMany({
      where: {
        householdId: session.householdId,
        isActive: true,
        warrantyEnd: { gte: now, lte: in30Days },
      },
      select: { id: true, name: true, warrantyEnd: true },
      orderBy: { warrantyEnd: 'asc' },
      take: 3,
    }),
  ]);

  const entries: AlertEntry[] = [];

  for (const b of overdueBills) {
    entries.push({
      id: `bill-${b.id}`,
      message: t('billOverdue', { title: b.title }),
      meta: formatCurrency(Number(b.amount), locale),
      severity: 'critical',
      kind: 'bill',
      href: `/${locale}/bills`,
      rank: SEVERITY_RANK.critical,
      date: new Date(b.dueDate),
    });
  }

  for (const b of dueSoonBills) {
    const days = Math.max(
      0,
      Math.round((new Date(b.dueDate).getTime() - now.getTime()) / 86400000)
    );
    entries.push({
      id: `bill-soon-${b.id}`,
      message:
        days === 0
          ? t('billDueToday', { title: b.title })
          : t('billDueSoon', { title: b.title, days }),
      meta: formatCurrency(Number(b.amount), locale),
      severity: 'warning',
      kind: 'bill',
      href: `/${locale}/bills`,
      rank: SEVERITY_RANK.warning,
      date: new Date(b.dueDate),
    });
  }

  for (const c of overdueChores) {
    entries.push({
      id: `chore-${c.id}`,
      message: t('choreOverdue', { title: c.name }),
      severity: 'warning',
      kind: 'chore',
      href: `/${locale}/chores`,
      rank: SEVERITY_RANK.warning,
      date: c.nextDueDate ? new Date(c.nextDueDate) : now,
    });
  }

  for (const a of expiringWarranties) {
    if (!a.warrantyEnd) continue;
    const days = Math.max(
      0,
      Math.round((new Date(a.warrantyEnd).getTime() - now.getTime()) / 86400000)
    );
    entries.push({
      id: `warranty-${a.id}`,
      message: t('warrantyExpiring', { title: a.name, days }),
      severity: 'info',
      kind: 'warranty',
      href: `/${locale}/appliances`,
      rank: SEVERITY_RANK.info,
      date: new Date(a.warrantyEnd),
    });
  }

  entries.sort((a, b) => a.rank - b.rank || a.date.getTime() - b.date.getTime());
  const top = entries.slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success"
          aria-hidden="true"
        >
          <CheckCircle2 size={22} strokeWidth={2.25} />
        </div>
        <p className="text-sm font-medium text-foreground">{t('empty')}</p>
        <p className="text-xs text-muted-foreground">{t('emptyDesc')}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1" role="list">
      {top.map((e) => (
        <li key={e.id}>
          <AlertItem
            message={e.message}
            meta={e.meta}
            severity={e.severity}
            kind={e.kind}
            href={e.href}
          />
        </li>
      ))}
    </ul>
  );
}
