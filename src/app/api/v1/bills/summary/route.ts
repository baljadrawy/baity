/**
 * GET /api/v1/bills/summary — ملخص الفواتير للـ Dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold } from '@/core/db/with-household';
import { BillsRepository } from '@/features/bills/api/repository';
import { handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) {
      return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });
    }

    const session = await authenticate(req);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new BillsRepository(session.householdId);
      const summary = await repo.getSummary();
      return NextResponse.json(summary);
    });
  } catch (err) {
    return handleApiError(err);
  }
}
