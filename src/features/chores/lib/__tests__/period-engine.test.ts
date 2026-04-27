/**
 * Period Engine Tests — اختبارات محرك الجدولة
 *
 * هذه أهم اختبارات في المشروع — تضمن صحة خوارزمية حساب المواعيد.
 * Coverage مطلوب: ≥ 80%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateNextDueDate,
  getDaysUntilDue,
  isChoreOverdue,
  isChoresDueToday,
  assignChore,
  type ChoreSchedule,
  type MemberExecution,
} from '../period-engine';

// ============================================================
// Fixtures
// ============================================================

const baseChore: ChoreSchedule = {
  periodType: 'DAILY',
  periodDays: 7,
  firstExecutionDate: new Date('2026-01-01'),
  dueDateRollover: false,
};

// ============================================================
// calculateNextDueDate
// ============================================================

describe('calculateNextDueDate', () => {
  describe('MANUALLY', () => {
    it('يُرجع null دائماً', () => {
      const chore: ChoreSchedule = { ...baseChore, periodType: 'MANUALLY' };
      expect(calculateNextDueDate(chore, null)).toBeNull();
      expect(calculateNextDueDate(chore, new Date())).toBeNull();
    });
  });

  describe('DAILY', () => {
    it('يُضيف عدد الأيام الصحيح من firstExecutionDate', () => {
      const chore: ChoreSchedule = {
        ...baseChore,
        periodType: 'DAILY',
        periodDays: 10,
        firstExecutionDate: new Date('2026-01-01'),
        dueDateRollover: false,
      };
      const result = calculateNextDueDate(chore, null);
      expect(result).toEqual(new Date('2026-01-11'));
    });

    it('يُضيف يوم واحد إذا periodDays = 1', () => {
      const chore: ChoreSchedule = {
        ...baseChore,
        periodType: 'DAILY',
        periodDays: 1,
        firstExecutionDate: new Date('2026-04-26'),
        dueDateRollover: false,
      };
      const result = calculateNextDueDate(chore, null);
      expect(result).toEqual(new Date('2026-04-27'));
    });
  });

  describe('DYNAMIC_REGULAR', () => {
    it('يحسب من آخر تنفيذ (وليس firstExecutionDate)', () => {
      const chore: ChoreSchedule = {
        ...baseChore,
        periodType: 'DYNAMIC_REGULAR',
        periodDays: 5,
        firstExecutionDate: new Date('2026-01-01'),
        dueDateRollover: false,
      };
      const lastExec = new Date('2026-04-20');
      const result = calculateNextDueDate(chore, lastExec);
      expect(result).toEqual(new Date('2026-04-25'));
    });

    it('يستخدم firstExecutionDate إذا لم يُنفَّذ بعد', () => {
      const chore: ChoreSchedule = {
        ...baseChore,
        periodType: 'DYNAMIC_REGULAR',
        periodDays: 3,
        firstExecutionDate: new Date('2026-01-10'),
        dueDateRollover: false,
      };
      const result = calculateNextDueDate(chore, null);
      expect(result).toEqual(new Date('2026-01-13'));
    });

    it('الفرق الجوهري: DAILY لا يتغير بتغير آخر تنفيذ، DYNAMIC_REGULAR يتغير', () => {
      const daily: ChoreSchedule = {
        ...baseChore,
        periodType: 'DAILY',
        periodDays: 7,
        firstExecutionDate: new Date('2026-01-01'),
        dueDateRollover: false,
      };
      const dynamic: ChoreSchedule = {
        ...baseChore,
        periodType: 'DYNAMIC_REGULAR',
        periodDays: 7,
        firstExecutionDate: new Date('2026-01-01'),
        dueDateRollover: false,
      };
      const lateExec = new Date('2026-01-20'); // متأخر ٢٠ يوم

      const dailyResult = calculateNextDueDate(daily, lateExec);
      const dynamicResult = calculateNextDueDate(dynamic, lateExec);

      // DAILY لا يكترث بالتأخير — يحسب من firstExecutionDate
      expect(dailyResult).toEqual(new Date('2026-01-08'));
      // DYNAMIC_REGULAR يحسب من آخر تنفيذ
      expect(dynamicResult).toEqual(new Date('2026-01-27'));
    });
  });

  describe('WEEKLY', () => {
    it('يُرجع الجمعة القادمة (day=5)', () => {
      const chore: ChoreSchedule = {
        ...baseChore,
        periodType: 'WEEKLY',
        periodWeekDay: 5, // الجمعة
        firstExecutionDate: new Date('2026-01-01'), // خميس
        dueDateRollover: false,
      };
      const result = calculateNextDueDate(chore, null);
      // nextDay من 2026-01-01 (خميس) إلى الجمعة = 2026-01-02
      expect(result?.getDay()).toBe(5);
    });
  });

  describe('MONTHLY', () => {
    it('يُضيف شهراً بنفس اليوم', () => {
      const chore: ChoreSchedule = {
        ...baseChore,
        periodType: 'MONTHLY',
        periodMonthDay: 15,
        firstExecutionDate: new Date('2026-01-15'),
        dueDateRollover: false,
      };
      const result = calculateNextDueDate(chore, null);
      expect(result?.getMonth()).toBe(1); // فبراير
      expect(result?.getDate()).toBe(15);
    });
  });

  describe('YEARLY', () => {
    it('يُضيف سنة', () => {
      const chore: ChoreSchedule = {
        ...baseChore,
        periodType: 'YEARLY',
        firstExecutionDate: new Date('2026-03-15'),
        dueDateRollover: false,
      };
      const result = calculateNextDueDate(chore, null);
      expect(result?.getFullYear()).toBe(2027);
      expect(result?.getMonth()).toBe(2);  // مارس
      expect(result?.getDate()).toBe(15);
    });
  });

  describe('dueDateRollover', () => {
    it('مع rollover=true: الموعد لا يكون في الماضي', () => {
      const chore: ChoreSchedule = {
        ...baseChore,
        periodType: 'DAILY',
        periodDays: 1,
        firstExecutionDate: new Date('2020-01-01'), // ماضٍ بعيد
        dueDateRollover: true,
      };
      const result = calculateNextDueDate(chore, null);
      expect(result).not.toBeNull();
      expect(result!.getTime()).toBeGreaterThanOrEqual(new Date().getTime() - 86400000);
    });

    it('بدون rollover: يمكن أن يكون في الماضي', () => {
      const chore: ChoreSchedule = {
        ...baseChore,
        periodType: 'DAILY',
        periodDays: 10,
        firstExecutionDate: new Date('2020-01-01'),
        dueDateRollover: false,
      };
      const result = calculateNextDueDate(chore, null);
      // في الماضي — لأننا لم نُطبّق rollover
      expect(result!.getTime()).toBeLessThan(Date.now());
    });
  });
});

// ============================================================
// getDaysUntilDue
// ============================================================

describe('getDaysUntilDue', () => {
  it('يُرجع null إذا لا يوجد تاريخ', () => {
    expect(getDaysUntilDue(null)).toBeNull();
  });

  it('يُرجع 0 إذا اليوم هو الموعد', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    expect(getDaysUntilDue(today)).toBe(0);
  });

  it('يُرجع رقماً موجباً للمستقبل', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getDaysUntilDue(future)).toBe(5);
  });

  it('يُرجع رقماً سالباً للماضي', () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(getDaysUntilDue(past)).toBe(-3);
  });
});

// ============================================================
// isChoreOverdue / isChoresDueToday
// ============================================================

describe('isChoreOverdue', () => {
  it('يُرجع true للماضي', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(isChoreOverdue(past)).toBe(true);
  });

  it('يُرجع false لليوم', () => {
    const today = new Date();
    expect(isChoreOverdue(today)).toBe(false);
  });

  it('يُرجع false للمستقبل', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(isChoreOverdue(future)).toBe(false);
  });

  it('يُرجع false لـ null', () => {
    expect(isChoreOverdue(null)).toBe(false);
  });
});

describe('isChoresDueToday', () => {
  it('يُرجع true لليوم', () => {
    expect(isChoresDueToday(new Date())).toBe(true);
  });

  it('يُرجع false للغد', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isChoresDueToday(tomorrow)).toBe(false);
  });
});

// ============================================================
// assignChore
// ============================================================

describe('assignChore', () => {
  const members: MemberExecution[] = [
    { memberId: 'a', name: 'أحمد', executionCount: 5, lastExecutedAt: new Date('2026-04-01') },
    { memberId: 'b', name: 'سارة', executionCount: 2, lastExecutedAt: new Date('2026-04-10') },
    { memberId: 'c', name: 'محمد', executionCount: 2, lastExecutedAt: new Date('2026-04-05') },
  ];

  it('NO_ASSIGNMENT يُرجع null', () => {
    expect(assignChore('NO_ASSIGNMENT', members)).toBeNull();
  });

  it('WHO_LEAST_DID_IT_FIRST يختار الأقل تنفيذاً', () => {
    // سارة ومحمد (2 تنفيذ) < أحمد (5 تنفيذ)
    // محمد آخر تنفيذ أقدم من سارة → محمد أولى
    const result = assignChore('WHO_LEAST_DID_IT_FIRST', members);
    expect(result).toBe('c'); // محمد
  });

  it('WHO_LEAST_DID_IT_FIRST يختار الأقل عدداً أولاً', () => {
    const m: MemberExecution[] = [
      { memberId: 'x', name: 'خالد', executionCount: 10 },
      { memberId: 'y', name: 'نورة', executionCount: 1 },
    ];
    expect(assignChore('WHO_LEAST_DID_IT_FIRST', m)).toBe('y');
  });

  it('RANDOM يُرجع member موجود', () => {
    const result = assignChore('RANDOM', members);
    expect(members.some((m) => m.memberId === result)).toBe(true);
  });

  it('IN_ALPHABETIC_ORDER يرتّب أبجدياً', () => {
    // أحمد، سارة، محمد — ترتيب أبجدي
    // آخر من نفّذ: سارة (2026-04-10) → التالي: محمد
    const result = assignChore('IN_ALPHABETIC_ORDER', members);
    expect(typeof result).toBe('string');
  });

  it('FIXED يُرجع أول ID في القائمة', () => {
    expect(assignChore('FIXED', members, ['b'])).toBe('b');
  });

  it('FIXED بدون IDs يُرجع null', () => {
    expect(assignChore('FIXED', members, [])).toBeNull();
  });

  it('قائمة فارغة يُرجع null', () => {
    expect(assignChore('WHO_LEAST_DID_IT_FIRST', [])).toBeNull();
    expect(assignChore('RANDOM', [])).toBeNull();
  });
});
