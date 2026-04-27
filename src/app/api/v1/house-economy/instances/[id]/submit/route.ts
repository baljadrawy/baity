/**
 * POST /api/v1/house-economy/instances/[id]/submit — الطفل يُرسل العمل للمراجعة
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { HouseEconomyRepository } from '@/features/house-economy/api/repository';
import { submitJobSchema } from '@/features/house-economy/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = submitJobSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new HouseEconomyRepository(session.householdId);
      const instance = await repo.submitJob(params.id, data, session.memberId);
      return NextResponse.json({ data: instance });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
