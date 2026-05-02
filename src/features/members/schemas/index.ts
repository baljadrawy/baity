/**
 * Members Schemas — Zod validation
 *
 * تعريف schemas لإضافة/تعديل/حذف أعضاء المنزل.
 * كل phone يمر عبر `convertToWesternDigits` قبل الـ regex.
 */

import { z } from 'zod';
import { convertToWesternDigits } from '@/core/i18n/format-number';

/** رقم جوال سعودي: 05X XXX XXXX */
const saudiPhoneRegex = /^05\d{8}$/;

const sanitizePhone = (phone: string): string =>
  convertToWesternDigits(phone).replace(/\s+/g, '');

const phoneSchema = z
  .string()
  .transform(sanitizePhone)
  .pipe(z.string().regex(saudiPhoneRegex, 'invalid_phone'));

const ageSchema = z.coerce.number().int().min(1).max(120);

const roleSchema = z.enum(['ADMIN', 'MEMBER', 'CHILD']);

/** PIN — 4 أرقام (للأطفال) */
const pinSchema = z
  .string()
  .transform((s) => convertToWesternDigits(s).replace(/\D/g, ''))
  .pipe(z.string().regex(/^\d{4}$/, 'invalid_pin'));

export const createMemberSchema = z
  .object({
    phone: phoneSchema,
    name: z.string().min(1).max(100),
    role: roleSchema,
    age: ageSchema.optional(),
    /** PIN إجباري للـ CHILD، مهمل لغيرها */
    pin: pinSchema.optional(),
  })
  .refine((d) => d.role !== 'CHILD' || !!d.age, {
    message: 'age_required_for_child',
    path: ['age'],
  })
  .refine((d) => d.role !== 'CHILD' || (d.age !== undefined && d.age >= 4 && d.age <= 17), {
    message: 'invalid_child_age',
    path: ['age'],
  })
  .refine((d) => d.role !== 'CHILD' || !!d.pin, {
    message: 'pin_required_for_child',
    path: ['pin'],
  });

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: roleSchema.optional(),
  age: ageSchema.optional(),
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const setMemberPinSchema = z.object({
  pin: pinSchema,
});
export type SetMemberPinInput = z.infer<typeof setMemberPinSchema>;
