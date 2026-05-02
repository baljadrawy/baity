/**
 * DELETE /api/v1/appliances/[id]/documents/[docId] — حذف وثيقة (وملفها من Storage)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { prisma } from '@/core/db/prisma';
import { deleteFile } from '@/core/storage';

interface RouteContext {
  params: Promise<{ id: string; docId: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { id, docId } = await params;

    return await withHousehold(session.userId, session.householdId, async () => {
      // verify ownership chain: doc → appliance → household
      const doc = await prisma.warrantyDocument.findFirst({
        where: {
          id: docId,
          applianceId: id,
          appliance: { householdId: session.householdId },
        },
        select: { id: true, fileUrl: true },
      });
      if (!doc) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }

      // حذف من DB أولاً (إن فشل storage، نستطيع cleanup لاحقاً)
      await prisma.warrantyDocument.delete({ where: { id: docId } });

      // محاولة حذف من Storage — لا نُفشل الطلب إن فشلت
      try {
        await deleteFile(doc.fileUrl);
      } catch (err) {
        console.warn('storage delete failed (orphan file):', err);
      }

      return NextResponse.json({ success: true });
    });
  } catch (error) {
    return handleApiError(error);
  }
}
