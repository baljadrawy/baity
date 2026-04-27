/**
 * POST /api/v1/house-economy/instances/[id]/approve — ولي الأمر يوافق
 * POST /api/v1/house-economy/instances/[id]/reject  — ولي الأمر يرفض
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError, isParent } from '@/core/db/with-household';
import { HouseEconomyRepository } from '@/features/house-economy/api/repository';
import { approveJobSchema } from '@/features/house-economy/schemas';
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
    const data = approveJobSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async (membership) => {
      if (!isParent(membership.role)) {
        return NextResponse.json({ error: 'ولي الأمر فقط يمكنه الموافقة' }, { status: 403 });
      }
      const repo = new HouseEconomyRepository(session.householdId);
      const instance = await repo.approveJob(id, data, session.memberId);
      return NextResponse.json({ data: instance });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
