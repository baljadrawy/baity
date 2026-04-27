/**
 * GET/PATCH/DELETE /api/v1/appliances/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { AppliancesRepository } from '@/features/appliances/api/repository';
import { updateApplianceSchema } from '@/features/appliances/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await authenticate(req);
    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new AppliancesRepository(session.householdId);
      const item = await repo.findById(params.id);
      if (!item) return NextResponse.json({ error: 'الجهاز غير موجود' }, { status: 404 });
      return NextResponse.json({ data: item });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = updateApplianceSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new AppliancesRepository(session.householdId);
      const item = await repo.update(params.id, data);
      return NextResponse.json({ data: item });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await authenticate(req);
    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new AppliancesRepository(session.householdId);
      await repo.delete(params.id);
      return NextResponse.json({ success: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
