/**
 * GET  /api/v1/house-economy/instances — قائمة طلبات الأعمال
 * POST /api/v1/house-economy/instances — بدء عمل جديد (الطفل)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { HouseEconomyRepository } from '@/features/house-economy/api/repository';
import { startJobSchema } from '@/features/house-economy/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticate(req);
    const { searchParams } = new URL(req.url);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new HouseEconomyRepository(session.householdId);
      const instances = await repo.listJobInstances({
        childId: searchParams.get('childId') ?? undefined,
        status: searchParams.get('status') ?? undefined,
        limit: Number(searchParams.get('limit') ?? 50),
      });
      return NextResponse.json({ data: instances });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = startJobSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new HouseEconomyRepository(session.householdId);
      const instance = await repo.startJob(data, session.memberId);
      return NextResponse.json({ data: instance }, { status: 201 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
