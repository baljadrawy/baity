/**
 * GET /api/v1/house-economy/pending — الأعمال بانتظار موافقة ولي الأمر
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError, isParent } from '@/core/db/with-household';
import { HouseEconomyRepository } from '@/features/house-economy/api/repository';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);

    return await withHousehold(session.userId, session.householdId, async (membership) => {
      if (!isParent(membership.role)) {
        return NextResponse.json({ error: 'ولي الأمر فقط' }, { status: 403 });
      }
      const repo = new HouseEconomyRepository(session.householdId);
      const pending = await repo.getPendingApprovals();
      return NextResponse.json({ data: pending });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
