/**
 * POST /api/v1/shopping/[id]/items — إضافة عنصر لقائمة
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { ShoppingRepository } from '@/features/shopping/api/repository';
import { createShoppingItemSchema } from '@/features/shopping/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = createShoppingItemSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ShoppingRepository(session.householdId);
      const item = await repo.addItem(params.id, data, session.memberId);
      return NextResponse.json({ data: item }, { status: 201 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
