/**
 * POST /api/v1/shopping/[id]/items — إضافة عنصر لقائمة
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { ShoppingRepository } from '@/features/shopping/api/repository';
import { createShoppingItemSchema } from '@/features/shopping/schemas';
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
    const data = createShoppingItemSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ShoppingRepository(session.householdId);
      const item = await repo.addItem(id, data, session.memberId);
      return NextResponse.json({ data: item }, { status: 201 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
