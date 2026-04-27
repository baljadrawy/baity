/**
 * Zod Schemas — وحدة الأجهزة والضمانات
 */

import { z } from 'zod';

export const createApplianceSchema = z.object({
  name: z.string().min(1, 'اسم الجهاز مطلوب').max(200),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  location: z.string().max(100).optional(),

  // معلومات الشراء
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.coerce.number().min(0).max(1_000_000).optional(),
  store: z.string().max(200).optional(),
  storeOrderNumber: z.string().max(100).optional(),

  // الضمان
  warrantyStart: z.coerce.date().optional(),
  warrantyEnd: z.coerce.date().optional(),
  warrantyMonths: z.coerce.number().int().min(0).max(120).optional(),
  warrantyType: z.enum(['MANUFACTURER', 'STORE', 'EXTENDED', 'THIRD_PARTY', 'NONE']).default('MANUFACTURER'),
  warrantyContact: z.string().max(200).optional(),
  warrantyNotes: z.string().max(500).optional(),
  warrantyNotifyDaysBefore: z.coerce.number().int().min(0).max(365).default(30),

  imageUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
});

export type CreateApplianceInput = z.infer<typeof createApplianceSchema>;
export const updateApplianceSchema = createApplianceSchema.partial();
export type UpdateApplianceInput = z.infer<typeof updateApplianceSchema>;

export const createMaintenanceScheduleSchema = z.object({
  taskName: z.string().min(1).max(200),
  intervalDays: z.coerce.number().int().positive(),
  lastDoneAt: z.coerce.date().optional(),
  nextDueAt: z.coerce.date(),
  notifyBeforeDays: z.coerce.number().int().min(0).max(90).default(7),
});
export type CreateMaintenanceScheduleInput = z.infer<typeof createMaintenanceScheduleSchema>;

export const applianceFiltersSchema = z.object({
  search: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  warrantyExpiringSoon: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ApplianceFilters = z.infer<typeof applianceFiltersSchema>;
