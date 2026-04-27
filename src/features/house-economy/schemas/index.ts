/**
 * Zod Schemas — وحدة اقتصاد البيت للأطفال
 */

import { z } from 'zod';

// ============================================================
// Job Menu Item Schemas
// ============================================================

export const createJobMenuItemSchema = z.object({
  title: z.string().min(1, 'اسم العمل مطلوب').max(200),
  description: z.string().max(500).optional(),
  iconEmoji: z.string().max(4).optional(),
  imageUrl: z.string().url().optional(),
  reward: z.coerce.number().min(0.25).max(9999),
  estimatedMinutes: z.coerce.number().int().positive().optional(),
  minAge: z.coerce.number().int().min(4).max(18).default(4),
  maxAge: z.coerce.number().int().min(4).max(18).optional(),
  category: z.string().max(50).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('EASY'),
  availableForIds: z.array(z.string()).default([]),
  weeklyLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export type CreateJobMenuItemInput = z.infer<typeof createJobMenuItemSchema>;
export const updateJobMenuItemSchema = createJobMenuItemSchema.partial();
export type UpdateJobMenuItemInput = z.infer<typeof updateJobMenuItemSchema>;

// ============================================================
// Job Instance Schemas
// ============================================================

export const startJobSchema = z.object({
  jobMenuItemId: z.string().min(1),
});
export type StartJobInput = z.infer<typeof startJobSchema>;

export const submitJobSchema = z.object({
  beforePhotoUrl: z.string().url().optional(),
  afterPhotoUrl: z.string().url().optional(),
});
export type SubmitJobInput = z.infer<typeof submitJobSchema>;

export const approveJobSchema = z.object({
  approvedAmount: z.coerce.number().min(0),
  bonusAmount: z.coerce.number().min(0).default(0),
  parentNotes: z.string().max(500).optional(),
});
export type ApproveJobInput = z.infer<typeof approveJobSchema>;

export const rejectJobSchema = z.object({
  parentNotes: z.string().max(500).optional(),
});
export type RejectJobInput = z.infer<typeof rejectJobSchema>;

// ============================================================
// Wallet Schemas
// ============================================================

export const updateWalletDistributionSchema = z.object({
  spendPercent: z.coerce.number().int().min(0).max(100),
  savePercent: z.coerce.number().int().min(0).max(100),
  charityPercent: z.coerce.number().int().min(0).max(100),
  surprisePercent: z.coerce.number().int().min(0).max(100),
  weeklyEarningsLimit: z.coerce.number().min(0).optional(),
}).refine(
  (d) => d.spendPercent + d.savePercent + d.charityPercent + d.surprisePercent <= 100,
  { message: 'مجموع النسب يجب أن لا يتجاوز 100%' }
);
export type UpdateWalletDistributionInput = z.infer<typeof updateWalletDistributionSchema>;

export const createSavingsGoalSchema = z.object({
  title: z.string().min(1).max(200),
  targetAmount: z.coerce.number().min(1),
  imageUrl: z.string().url().optional(),
});
export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
