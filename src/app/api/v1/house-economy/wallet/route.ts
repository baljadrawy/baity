/**
 * GET /api/v1/house-economy/wallet — ملخص محافظ كل الأطفال
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { HouseEconomyRepository } from '@/features/house-economy/api/repository';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new HouseEconomyRepository(session.householdId);
      const summary = await repo.getWalletSummary();
      return NextResponse.json(summary);
    });
  } catch (err) {
    return handleApiError(err);
  }
}
