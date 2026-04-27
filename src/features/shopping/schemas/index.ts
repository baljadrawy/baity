/**
 * Zod Schemas — وحدة قوائم التسوق
 * مبنية على prisma/schema.prisma الفعلي
 */

import { z } from 'zod';

export const createShoppingListSchema = z.object({
  name: z
    .string({ required_error: 'اسم القائمة مطلوب' })
    .min(1, 'اسم القائمة مطلوب')
    .max(200),
  isShared: z.boolean().default(true),
});
export type CreateShoppingListInput = z.infer<typeof createShoppingListSchema>;

export const updateShoppingListSchema = createShoppingListSchema.partial();
export type UpdateShoppingListInput = z.infer<typeof updateShoppingListSchema>;

export const createShoppingItemSchema = z.object({
  name: z
    .string({ required_error: 'اسم المنتج مطلوب' })
    .min(1, 'اسم المنتج مطلوب')
    .max(200),
  category: z.string().max(100).optional(),
  quantity: z.string().max(50).optional(),
  unit: z.string().max(30).optional(),
  estimatedPrice: z.coerce.number().min(0).max(100_000).optional(),
  urgency: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  store: z.string().max(100).optional(),
});
export type CreateShoppingItemInput = z.infer<typeof createShoppingItemSchema>;

export const updateShoppingItemSchema = createShoppingItemSchema.partial().extend({
  isChecked: z.boolean().optional(),
  checkedById: z.string().optional(),
});
export type UpdateShoppingItemInput = z.infer<typeof updateShoppingItemSchema>;
