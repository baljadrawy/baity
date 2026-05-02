/**
 * GET /api/v1/family-bank — ملخص بنك العائلة (aggregation لكل ChildWallet)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { FamilyBankRepository } from '@/features/family-bank/api/repository';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new FamilyBankRepository(session.householdId);
      const summary = await repo.getSummary();
      return NextResponse.json({ data: summary });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
