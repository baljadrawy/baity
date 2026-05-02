/**
 * GET  /api/v1/appliances/[id]/documents — قائمة وثائق جهاز
 * POST /api/v1/appliances/[id]/documents — إضافة وثيقة (بعد رفع الملف عبر /api/v1/upload)
 *
 * Body POST:
 *   - type: DocumentType
 *   - title: string
 *   - filePath: string (المسار في storage — من response /api/v1/upload)
 *   - fileName: string
 *   - fileSize: number
 *   - mimeType: string
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { prisma } from '@/core/db/prisma';
import { createSignedUrl } from '@/core/storage';

const DocumentTypeEnum = z.enum([
  'PURCHASE_INVOICE',
  'WARRANTY_CARD',
  'USER_MANUAL',
  'RECEIPT',
  'SERVICE_REPORT',
  'PRODUCT_PHOTO',
  'OTHER',
]);

const createDocumentSchema = z.object({
  type: DocumentTypeEnum,
  title: z.string().min(1).max(200),
  filePath: z.string().min(1).max(500),
  fileName: z.string().min(1).max(200),
  fileSize: z.coerce.number().int().positive(),
  mimeType: z.string().min(1).max(100),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getApplianceForHousehold(applianceId: string, householdId: string) {
  return prisma.appliance.findFirst({
    where: { id: applianceId, householdId, isActive: true },
    select: { id: true },
  });
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { id } = await params;

    return await withHousehold(session.userId, session.householdId, async () => {
      const appliance = await getApplianceForHousehold(id, session.householdId);
      if (!appliance) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }

      const docs = await prisma.warrantyDocument.findMany({
        where: { applianceId: id },
        orderBy: { uploadedAt: 'desc' },
      });

      // signed URL لكل وثيقة (1 ساعة)
      const data = await Promise.all(
        docs.map(async (d) => {
          let url: string | null = null;
          try {
            url = await createSignedUrl(d.fileUrl, 3600);
          } catch {
            // في حالة فشل توليد الرابط (مثلاً الملف محذوف من الـ bucket)
            url = null;
          }
          return {
            id: d.id,
            type: d.type,
            title: d.title,
            fileName: d.fileName,
            fileSize: d.fileSize,
            mimeType: d.mimeType,
            uploadedAt: d.uploadedAt,
            uploadedById: d.uploadedById,
            signedUrl: url,
          };
        })
      );

      return NextResponse.json({ data });
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { id } = await params;
    const body = await req.json();
    const data = createDocumentSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const appliance = await getApplianceForHousehold(id, session.householdId);
      if (!appliance) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }

      // التحقق أن المسار يبدأ بالـ householdId — حماية من التلاعب
      if (!data.filePath.startsWith(`${session.householdId}/`)) {
        return NextResponse.json({ error: 'invalid_path' }, { status: 400 });
      }

      const doc = await prisma.warrantyDocument.create({
        data: {
          applianceId: id,
          type: data.type,
          title: data.title,
          fileUrl: data.filePath,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          uploadedById: session.memberId,
        },
      });

      return NextResponse.json(
        {
          data: {
            id: doc.id,
            type: doc.type,
            title: doc.title,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            uploadedAt: doc.uploadedAt,
          },
        },
        { status: 201 }
      );
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'validation_error', details: error.errors },
        { status: 422 }
      );
    }
    return handleApiError(error);
  }
}
