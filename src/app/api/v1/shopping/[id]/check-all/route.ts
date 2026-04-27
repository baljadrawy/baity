/**
 * POST /api/v1/shopping/[id]/check-all — تأشير كل العناصر (رجعنا من التسوق)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { ShoppingRepository } from '@/features/shopping/api/repository';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ShoppingRepository(session.householdId);
      await repo.checkAllItems(params.id, session.memberId);
      return NextResponse.json({ success: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
