/**
 * GET    /api/v1/house-economy/jobs/[id]
 * PATCH  /api/v1/house-economy/jobs/[id]
 * DELETE /api/v1/house-economy/jobs/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError, isParent } from '@/core/db/with-household';
import { HouseEconomyRepository } from '@/features/house-economy/api/repository';
import { updateJobMenuItemSchema } from '@/features/house-economy/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await authenticate(req);
    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new HouseEconomyRepository(session.householdId);
      const item = await repo.findJobMenuItemById(params.id);
      if (!item) return NextResponse.json({ error: 'العمل غير موجود' }, { status: 404 });
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
    const data = updateJobMenuItemSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async (membership) => {
      if (!isParent(membership.role)) {
        return NextResponse.json({ error: 'ولي الأمر فقط' }, { status: 403 });
      }
      const repo = new HouseEconomyRepository(session.householdId);
      const item = await repo.updateJobMenuItem(params.id, data);
      return NextResponse.json({ data: item });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await authenticate(req);
    return await withHousehold(session.userId, session.householdId, async (membership) => {
      if (!isParent(membership.role)) {
        return NextResponse.json({ error: 'ولي الأمر فقط' }, { status: 403 });
      }
      const repo = new HouseEconomyRepository(session.householdId);
      await repo.deleteJobMenuItem(params.id);
      return NextResponse.json({ success: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
