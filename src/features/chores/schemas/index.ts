/**
 * Zod Schemas — وحدة المهام الدورية
 */

import { z } from 'zod';

export const PeriodTypeEnum = z.enum([
  'MANUALLY',
  'DAILY',
  'DYNAMIC_REGULAR',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
]);

export const AssignmentTypeEnum = z.enum([
  'NO_ASSIGNMENT',
  'WHO_LEAST_DID_IT_FIRST',
  'RANDOM',
  'IN_ALPHABETIC_ORDER',
  'FIXED',
]);

export const createChoreSchema = z.object({
  name: z
    .string({ required_error: 'اسم المهمة مطلوب' })
    .min(1, 'اسم المهمة مطلوب')
    .max(200),

  description: z.string().max(500).optional(),

  periodType: PeriodTypeEnum,

  /** عدد الأيام — مطلوب إذا periodType = DAILY | DYNAMIC_REGULAR */
  periodDays: z.coerce.number().int().positive().optional(),

  /** يوم الأسبوع (0=الأحد...6=السبت) — مطلوب إذا periodType = WEEKLY */
  periodWeekDay: z.coerce.number().int().min(0).max(6).optional(),

  /** يوم الشهر (1-31) — مطلوب إذا periodType = MONTHLY */
  periodMonthDay: z.coerce.number().int().min(1).max(31).optional(),

  assignmentType: AssignmentTypeEnum.default('NO_ASSIGNMENT'),

  /** IDs الأعضاء المُسنَد إليهم — فقط إذا assignmentType = FIXED */
  assignedMembers: z.array(z.string()).default([]),

  firstExecutionDate: z.coerce.date().default(() => new Date()),

  notifyBeforeDays: z.coerce.number().int().min(0).max(30).default(1),

  pointsReward: z.coerce.number().int().min(0).max(1000).default(0),

  trackDateOnly: z.boolean().default(false),

  dueDateRollover: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.periodType === 'DAILY' || data.periodType === 'DYNAMIC_REGULAR') {
      return data.periodDays !== undefined && data.periodDays > 0;
    }
    return true;
  },
  { message: 'عدد الأيام مطلوب لهذا النوع من التكرار', path: ['periodDays'] }
);

export type CreateChoreInput = z.infer<typeof createChoreSchema>;

export const updateChoreSchema = createChoreSchema.partial();
export type UpdateChoreInput = z.infer<typeof updateChoreSchema>;

export const executeChoreSchema = z.object({
  executedAt: z.coerce.date().default(() => new Date()),
  /** اختياري — الافتراضي هو session.memberId (يُحدَّد في الـ route) */
  executedBy: z.string().min(1).optional(),
  notes: z.string().max(500).optional(),
});

export type ExecuteChoreInput = z.infer<typeof executeChoreSchema>;
