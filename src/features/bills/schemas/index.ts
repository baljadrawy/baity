/**
 * Zod Schemas — وحدة الفواتير
 * كل input يمر عبر Zod قبل الوصول للـ DB
 * الأرقام الهندية تُحوَّل تلقائياً عبر convertToWesternDigits
 */

import { z } from 'zod';

// ============================================================
// Helpers
// ============================================================

const positiveDecimal = z.coerce
  .number({ invalid_type_error: 'يجب أن يكون رقماً' })
  .positive({ message: 'يجب أن يكون أكبر من صفر' })
  .max(1_000_000, { message: 'القيمة كبيرة جداً' });

// ============================================================
// Enums
// ============================================================

export const BillStatusEnum = z.enum(['PENDING', 'DUE', 'PAID', 'OVERDUE']);
export const BillCategoryEnum = z.enum([
  'ELECTRICITY',
  'WATER',
  'TELECOM',
  'INTERNET',
  'SUBSCRIPTION',
  'RENT',
  'INSURANCE',
  'OTHER',
]);
export const RecurrencePeriodEnum = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
]);

// ============================================================
// Create Bill
// ============================================================

export const createBillSchema = z.object({
  title: z
    .string({ required_error: 'اسم الفاتورة مطلوب' })
    .min(1, 'اسم الفاتورة مطلوب')
    .max(200, 'الاسم طويل جداً'),

  category: BillCategoryEnum,

  provider: z
    .string()
    .max(100)
    .optional()
    .transform((v) => v?.trim() || undefined),

  accountNumber: z
    .string()
    .max(50)
    .optional()
    .transform((v) => v?.trim() || undefined),

  amount: positiveDecimal,

  dueDate: z.coerce
    .date({ required_error: 'تاريخ الاستحقاق مطلوب' })
    .min(new Date('2020-01-01'), { message: 'التاريخ قديم جداً' }),

  isRecurring: z.boolean().default(false),
  recurrencePeriod: RecurrencePeriodEnum.optional(),

  notes: z
    .string()
    .max(500)
    .optional()
    .transform((v) => v?.trim() || undefined),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

// ============================================================
// Update Bill
// ============================================================

export const updateBillSchema = createBillSchema.partial().extend({
  status: BillStatusEnum.optional(),
});

export type UpdateBillInput = z.infer<typeof updateBillSchema>;

// ============================================================
// Pay Bill
// ============================================================

export const payBillSchema = z.object({
  amount: positiveDecimal,
  paidAt: z.coerce.date().default(() => new Date()),
  notes: z.string().max(500).optional(),
});

export type PayBillInput = z.infer<typeof payBillSchema>;

// ============================================================
// Filter Bills
// ============================================================

export const billFiltersSchema = z.object({
  status: BillStatusEnum.optional(),
  category: BillCategoryEnum.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type BillFilters = z.infer<typeof billFiltersSchema>;
