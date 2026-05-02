/**
 * Archive Schemas — DocumentArchive validation
 */

import { z } from 'zod';

export const ARCHIVE_CATEGORIES = [
  'INVOICE',
  'CONTRACT',
  'INSURANCE',
  'GOVERNMENT',
  'MEDICAL',
  'EDUCATION',
  'PROPERTY',
  'VEHICLE',
  'OTHER',
] as const;

const archiveCategorySchema = z.enum(ARCHIVE_CATEGORIES);

export const createArchiveSchema = z.object({
  category: archiveCategorySchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  /** المسار في Storage — بعد رفع الملف عبر /api/v1/upload */
  filePath: z.string().min(1).max(500),
  fileName: z.string().min(1).max(200),
  fileSize: z.coerce.number().int().positive(),
  mimeType: z.string().min(1).max(100),
  documentDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  notifyBeforeDays: z.coerce.number().int().min(0).max(365).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
});
export type CreateArchiveInput = z.infer<typeof createArchiveSchema>;

export const updateArchiveSchema = createArchiveSchema
  .partial()
  .omit({ filePath: true, fileName: true, fileSize: true, mimeType: true });
export type UpdateArchiveInput = z.infer<typeof updateArchiveSchema>;

export const archiveFiltersSchema = z.object({
  category: archiveCategorySchema.optional(),
  search: z.string().max(200).optional(),
  /** تصفية حسب expiryDate القريبة */
  expiringSoon: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ArchiveFilters = z.infer<typeof archiveFiltersSchema>;

export type ArchiveCategory = (typeof ARCHIVE_CATEGORIES)[number];
