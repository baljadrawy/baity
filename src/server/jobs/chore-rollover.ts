/**
 * chore-rollover.ts — Cron Job لتحديث حالات المهام الدورية
 *
 * يعمل يومياً:
 * 1. يُحدّث nextDueDate لكل مهمة نشطة
 * 2. يُرسل تنبيهات Telegram للمهام التي تستحق قريباً
 * 3. يتحقق من المهام المتأخرة ويُرسل تذكيرات
 *
 * يُستدعى من: GET /api/v1/cron/chore-rollover
 */

import { prisma } from '@/core/db/prisma';
import { calculateNextDueDate, getDaysUntilDue } from '@/features/chores/lib/period-engine';

export interface ChoreRolloverResult {
  updated: number;
  notificationsScheduled: number;
  overdueCount: number;
}

/**
 * تحديث nextDueDate لكل المهام النشطة
 */
export async function runChoreRollover(): Promise<ChoreRolloverResult> {
  const chores = await prisma.chore.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      periodType: { not: 'MANUALLY' },
    },
    include: {
      executions: {
        orderBy: { executedAt: 'desc' },
        take: 1,
        select: { executedAt: true },
      },
    },
  });

  let updated = 0;
  let overdueCount = 0;
  let notificationsScheduled = 0;

  for (const chore of chores) {
    const lastExecutedAt = chore.executions[0]?.executedAt ?? null;

    const schedule = {
      periodType: chore.periodType,
      periodDays: chore.periodDays,
      periodWeekDay: chore.periodWeekDay,
      periodMonthDay: chore.periodMonthDay,
      firstExecutionDate: chore.firstExecutionDate,
      dueDateRollover: chore.dueDateRollover,
    };

    const nextDueDate = calculateNextDueDate(schedule, lastExecutedAt);
    const daysUntilDue = getDaysUntilDue(nextDueDate);

    if (daysUntilDue !== null && daysUntilDue < 0) {
      overdueCount++;
    }

    // تحديث nextDueDate في الـ DB
    await prisma.chore.update({
      where: { id: chore.id },
      data: { nextDueDate, updatedAt: new Date() },
    });
    updated++;

    // جدولة إشعار إذا كانت المهمة تستحق قريباً
    if (
      daysUntilDue !== null &&
      daysUntilDue >= 0 &&
      daysUntilDue <= chore.notifyBeforeDays
    ) {
      notificationsScheduled++;
      // TODO: إرسال إشعار Telegram في الأسبوع 6
    }
  }

  return { updated, notificationsScheduled, overdueCount };
}
