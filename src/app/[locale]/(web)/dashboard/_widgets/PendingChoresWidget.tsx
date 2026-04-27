/**
 * PendingChoresWidget — المهام المعلقة والمتأخرة
 * Server Component — Prisma query مباشرة
 */

import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { prisma } from '@/core/db';
import { getServerSession } from '@/core/auth/server-session';
import { EmptyState } from '@/shared/ui/EmptyState';

export async function PendingChoresWidget() {
  const t = await getTranslations('chores');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();

  const session = await getServerSession();
  if (!session) return null;

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 86400000);

  // مهام نشطة: متأخرة أو مستحقة خلال 3 أيام
  const chores = await prisma.chore.findMany({
    where: {
      householdId: session.householdId,
      deletedAt: null,
      isActive: true,
      nextDueDate: { lte: in3Days },
    },
    orderBy: { nextDueDate: 'asc' },
    take: 5,
    select: {
      id: true,
      name: true,
      nextDueDate: true,
      assignedMemberIds: true,
    },
  });

  // جلب أسماء الأعضاء دفعةً واحدة
  const allMemberIds = [...new Set(chores.flatMap((c) => c.assignedMemberIds))];
  const members =
    allMemberIds.length > 0
      ? await prisma.householdMember.findMany({
          where: { id: { in: allMemberIds } },
          select: { id: true, user: { select: { name: true } } },
        })
      : [];
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.user?.name ?? '']));

  if (chores.length === 0) {
    return <EmptyState icon="✨" title={t('allDone')} description={t('allDoneDesc')} />;
  }

  return (
    <ul className="flex flex-col gap-2" role="list">
      {chores.map((chore) => {
        const dueDate = chore.nextDueDate ? new Date(chore.nextDueDate) : null;
        const overdueDays = dueDate
          ? Math.round((now.getTime() - dueDate.getTime()) / 86400000)
          : 0;
        const firstAssigneeId = chore.assignedMemberIds[0];
        const assigneeName =
          firstAssigneeId !== undefined
            ? memberMap[firstAssigneeId] ?? t('anyMember')
            : t('anyMember');

        return (
          <li key={chore.id}>
            <Link
              href={`/${locale}/chores`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow"
            >
              <span className="text-2xl flex-shrink-0" aria-hidden="true">📋</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{chore.name}</p>
                <p className="text-xs text-muted-foreground truncate">{assigneeName}</p>
              </div>
              {overdueDays > 0 ? (
                <span className="flex-shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  {tCommon('overdueBy', { days: overdueDays })}
                </span>
              ) : (
                <span className="flex-shrink-0 rounded-full bg-amber-100 dark:bg-amber-950/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {tCommon('today')}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
