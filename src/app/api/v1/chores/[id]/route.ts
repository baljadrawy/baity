/**
 * GET    /api/v1/chores/[id]
 * PATCH  /api/v1/chores/[id]
 * DELETE /api/v1/chores/[id]
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { ChoresRepository } from '@/features/chores/api/repository';
import { updateChoreSchema } from '@/features/chores/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await authenticate(req);
    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ChoresRepository(session.householdId);
      const chore = await repo.findById(id);
      if (!chore) return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
      return NextResponse.json(chore);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = updateChoreSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ChoresRepository(session.householdId);
      const existing = await repo.findById(id);
      if (!existing) return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
      const updated = await repo.update(id, data);
      return NextResponse.json(updated);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const session = await authenticate(req);
    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ChoresRepository(session.householdId);
      const existing = await repo.findById(id);
      if (!existing) return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
      await repo.delete(id);
      return new NextResponse(null, { status: 204 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
