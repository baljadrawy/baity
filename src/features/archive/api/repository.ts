/**
 * Archive Repository — Data Access للأرشيف العام
 *
 * كل query مفلتر بـ householdId.
 * `fileUrl` يخزّن المسار في Storage (لا signed URL — يُولَّد عند الطلب).
 */

import { prisma } from '@/core/db/prisma';
import { createSignedUrl, deleteFile } from '@/core/storage';
import type {
  CreateArchiveInput,
  UpdateArchiveInput,
  ArchiveFilters,
} from '../schemas';

export interface ArchiveItemView {
  id: string;
  category: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentDate: Date | null;
  expiryDate: Date | null;
  daysUntilExpiry: number | null;
  notifyBeforeDays: number | null;
  tags: string[];
  uploadedAt: Date;
  uploadedById: string;
  signedUrl: string | null;
}

export class ArchiveRepository {
  constructor(private readonly householdId: string) {}

  async list(filters?: ArchiveFilters): Promise<{ data: ArchiveItemView[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const now = new Date();
    const soonThreshold = new Date(now.getTime() + 60 * 86400000);

    const where = {
      householdId: this.householdId,
      deletedAt: null,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' as const } },
          { description: { contains: filters.search, mode: 'insensitive' as const } },
          { tags: { has: filters.search } },
        ],
      }),
      ...(filters?.expiringSoon && {
        expiryDate: { gte: now, lte: soonThreshold },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.documentArchive.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.documentArchive.count({ where }),
    ]);

    const data = await Promise.all(
      items.map(async (it) => {
        let signedUrl: string | null = null;
        try {
          signedUrl = await createSignedUrl(it.fileUrl, 3600);
        } catch {
          signedUrl = null;
        }
        const daysUntilExpiry = it.expiryDate
          ? Math.round(
              (new Date(it.expiryDate).getTime() - now.getTime()) / 86400000
            )
          : null;
        return {
          id: it.id,
          category: it.category,
          title: it.title,
          description: it.description,
          fileName: it.fileName,
          fileSize: it.fileSize,
          mimeType: it.mimeType,
          documentDate: it.documentDate,
          expiryDate: it.expiryDate,
          daysUntilExpiry,
          notifyBeforeDays: it.notifyBeforeDays,
          tags: it.tags,
          uploadedAt: it.uploadedAt,
          uploadedById: it.uploadedById,
          signedUrl,
        };
      })
    );

    return { data, total };
  }

  async create(data: CreateArchiveInput, uploadedById: string): Promise<ArchiveItemView> {
    // التحقق أن المسار يبدأ بـ householdId — multi-tenancy enforcement
    if (!data.filePath.startsWith(`${this.householdId}/`)) {
      throw new Error('invalid_path');
    }

    const item = await prisma.documentArchive.create({
      data: {
        householdId: this.householdId,
        category: data.category,
        title: data.title,
        description: data.description,
        fileUrl: data.filePath,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        documentDate: data.documentDate,
        expiryDate: data.expiryDate,
        notifyBeforeDays: data.notifyBeforeDays,
        tags: data.tags ?? [],
        uploadedById,
      },
    });

    let signedUrl: string | null = null;
    try {
      signedUrl = await createSignedUrl(item.fileUrl, 3600);
    } catch {
      /* ignore */
    }

    return {
      id: item.id,
      category: item.category,
      title: item.title,
      description: item.description,
      fileName: item.fileName,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      documentDate: item.documentDate,
      expiryDate: item.expiryDate,
      daysUntilExpiry: null,
      notifyBeforeDays: item.notifyBeforeDays,
      tags: item.tags,
      uploadedAt: item.uploadedAt,
      uploadedById: item.uploadedById,
      signedUrl,
    };
  }

  async update(id: string, data: UpdateArchiveInput): Promise<void> {
    const existing = await prisma.documentArchive.findFirst({
      where: { id, householdId: this.householdId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new Error('not_found');

    await prisma.documentArchive.update({
      where: { id },
      data: {
        ...(data.category !== undefined && { category: data.category }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.documentDate !== undefined && { documentDate: data.documentDate }),
        ...(data.expiryDate !== undefined && { expiryDate: data.expiryDate }),
        ...(data.notifyBeforeDays !== undefined && {
          notifyBeforeDays: data.notifyBeforeDays,
        }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.documentArchive.findFirst({
      where: { id, householdId: this.householdId, deletedAt: null },
      select: { id: true, fileUrl: true },
    });
    if (!existing) throw new Error('not_found');

    // soft delete + محاولة حذف من Storage
    await prisma.documentArchive.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    try {
      await deleteFile(existing.fileUrl);
    } catch (err) {
      console.warn('storage delete failed (orphan file):', err);
    }
  }
}
