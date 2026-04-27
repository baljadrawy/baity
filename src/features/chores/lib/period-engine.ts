/**
 * Period Engine — محرك حساب مواعيد المهام الدورية
 *
 * مستوحى من خوارزمية Grocy مع تحسينات للسياق السعودي.
 * Reference: https://github.com/grocy/grocy — calculateNextDueDate
 *
 * Pure functions — قابلة للاختبار بدون DB أو side effects.
 */

import { addDays, addWeeks, addMonths, addYears, setDate, nextDay } from 'date-fns';

/** نوع التكرار المطابق لـ Prisma enum */
export type PeriodType =
  | 'MANUALLY'
  | 'DAILY'
  | 'DYNAMIC_REGULAR'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'YEARLY';

export interface ChoreSchedule {
  periodType: PeriodType;
  periodDays?: number | null;
  periodWeekDay?: number | null;   // 0=الأحد, 1=الإثنين, ..., 6=السبت
  periodMonthDay?: number | null;  // 1-31
  firstExecutionDate: Date;
  dueDateRollover: boolean;
}

/**
 * يحسب الموعد القادم لمهمة دورية.
 *
 * الخوارزمية:
 * - MANUALLY: يُرجع null (لا حساب تلقائي)
 * - DYNAMIC_REGULAR: يحسب من آخر تنفيذ فعلي
 * - DAILY/WEEKLY/MONTHLY/YEARLY: يحسب من تاريخ الإنشاء
 *
 * @param chore - بيانات جدولة المهمة
 * @param lastExecutedAt - تاريخ آخر تنفيذ (null إذا لم تُنفَّذ بعد)
 * @returns تاريخ الموعد القادم، أو null إذا periodType = MANUALLY
 */
export function calculateNextDueDate(
  chore: ChoreSchedule,
  lastExecutedAt: Date | null
): Date | null {
  if (chore.periodType === 'MANUALLY') return null;

  // DYNAMIC_REGULAR: الأساس هو آخر تنفيذ فعلي
  // باقي الأنواع: الأساس هو firstExecutionDate (أو آخر تنفيذ إذا لم تُنفَّذ بعد)
  const baseDate =
    chore.periodType === 'DYNAMIC_REGULAR'
      ? lastExecutedAt ?? chore.firstExecutionDate
      : chore.firstExecutionDate;

  let next: Date;

  switch (chore.periodType) {
    case 'DAILY':
      next = addDays(baseDate, chore.periodDays ?? 1);
      break;

    case 'DYNAMIC_REGULAR':
      next = addDays(baseDate, chore.periodDays ?? 1);
      break;

    case 'WEEKLY': {
      // التالي في نفس اليوم من الأسبوع
      const targetDay = chore.periodWeekDay ?? 5; // الجمعة افتراضياً
      next = nextDay(baseDate, targetDay as 0 | 1 | 2 | 3 | 4 | 5 | 6);
      break;
    }

    case 'MONTHLY': {
      // نفس اليوم من الشهر القادم
      const targetDay = chore.periodMonthDay ?? 1;
      next = addMonths(baseDate, 1);
      next = setDate(next, Math.min(targetDay, getDaysInMonth(next)));
      break;
    }

    case 'YEARLY':
      next = addYears(baseDate, 1);
      break;

    default:
      return null;
  }

  // Rollover: إذا فات الموعد، انقله للأمام حتى لا يكون في الماضي
  if (chore.dueDateRollover) {
    const now = new Date();
    while (next < now) {
      next = stepForward(chore, next);
    }
  }

  return next;
}

/**
 * يحسب عدد الأيام المتبقية حتى الموعد القادم.
 * يُرجع رقماً سالباً إذا فات الموعد.
 */
export function getDaysUntilDue(dueDate: Date | null): number | null {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * هل المهمة متأخرة؟
 */
export function isChoreOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  const days = getDaysUntilDue(dueDate);
  return days !== null && days < 0;
}

/**
 * هل المهمة تستحق اليوم؟
 */
export function isChoresDueToday(dueDate: Date | null): boolean {
  const days = getDaysUntilDue(dueDate);
  return days === 0;
}

// ============================================================
// Assignment Engine — خوارزميات توزيع المهام
// ============================================================

export type AssignmentType =
  | 'NO_ASSIGNMENT'
  | 'WHO_LEAST_DID_IT_FIRST'
  | 'RANDOM'
  | 'IN_ALPHABETIC_ORDER'
  | 'FIXED';

export interface MemberExecution {
  memberId: string;
  name: string;
  executionCount: number;
  lastExecutedAt?: Date | null;
}

/**
 * يُحدد من يجب أن ينفذ المهمة القادمة.
 *
 * @param assignmentType - نوع الإسناد
 * @param members - قائمة الأعضاء المؤهلين مع إحصائياتهم
 * @param fixedMemberIds - IDs محددة (للنوع FIXED)
 * @returns memberId المُسنَد إليه، أو null
 */
export function assignChore(
  assignmentType: AssignmentType,
  members: MemberExecution[],
  fixedMemberIds: string[] = []
): string | null {
  if (members.length === 0) return null;

  switch (assignmentType) {
    case 'NO_ASSIGNMENT':
      return null;

    case 'WHO_LEAST_DID_IT_FIRST': {
      // الشخص الأقل تنفيذاً — عدالة آلية
      const sorted = [...members].sort((a, b) => {
        if (a.executionCount !== b.executionCount) {
          return a.executionCount - b.executionCount;
        }
        // تعادل في العدد → الأقدم في آخر تنفيذ
        const aDate = a.lastExecutedAt?.getTime() ?? 0;
        const bDate = b.lastExecutedAt?.getTime() ?? 0;
        return aDate - bDate;
      });
      return sorted[0]?.memberId ?? null;
    }

    case 'RANDOM': {
      const idx = Math.floor(Math.random() * members.length);
      return members[idx]?.memberId ?? null;
    }

    case 'IN_ALPHABETIC_ORDER': {
      // ترتيب أبجدي دوري بناءً على آخر من نفّذ
      const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      // من ينفّذ بعد آخر منفّذ بالترتيب الأبجدي
      const lastExecuted = members.reduce(
        (latest, m) => {
          if (!m.lastExecutedAt) return latest;
          if (!latest.lastExecutedAt) return m;
          return m.lastExecutedAt > latest.lastExecutedAt ? m : latest;
        },
        members[0]!
      );

      const lastIdx = sorted.findIndex((m) => m.memberId === lastExecuted.memberId);
      const nextIdx = (lastIdx + 1) % sorted.length;
      return sorted[nextIdx]?.memberId ?? null;
    }

    case 'FIXED': {
      if (fixedMemberIds.length === 0) return null;
      // عادةً عضو واحد محدد
      return fixedMemberIds[0] ?? null;
    }

    default:
      return null;
  }
}

// ============================================================
// Helpers داخلية
// ============================================================

function stepForward(chore: ChoreSchedule, date: Date): Date {
  switch (chore.periodType) {
    case 'DAILY':
    case 'DYNAMIC_REGULAR':
      return addDays(date, chore.periodDays ?? 1);
    case 'WEEKLY':
      return addWeeks(date, 1);
    case 'MONTHLY':
      return addMonths(date, 1);
    case 'YEARLY':
      return addYears(date, 1);
    default:
      return addDays(date, 1);
  }
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
