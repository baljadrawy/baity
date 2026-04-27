/**
 * POST /api/v1/house-economy/instances/[id]/submit — الطفل يُرسل العمل للمراجعة
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { HouseEconomyRepository } from '@/features/house-economy/api/repository';
import { submitJobSchema } from '@/features/house-economy/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = submitJobSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new HouseEconomyRepository(session.householdId);
      const instance = await repo.submitJob(id, data, session.memberId);
      return NextResponse.json({ data: instance });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
