/**
 * GET  /api/v1/shopping — قائمة قوائم المشتريات
 * POST /api/v1/shopping — إنشاء قائمة جديدة
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { ShoppingRepository } from '@/features/shopping/api/repository';
import { createShoppingListSchema } from '@/features/shopping/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const { searchParams } = new URL(req.url);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ShoppingRepository(session.householdId);
      const result = await repo.listLists({
        search: searchParams.get('search') ?? undefined,
        page: Number(searchParams.get('page') ?? 1),
        limit: Number(searchParams.get('limit') ?? 20),
      });
      return NextResponse.json(result);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = createShoppingListSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ShoppingRepository(session.householdId);
      const list = await repo.createList(data, session.memberId);
      return NextResponse.json({ data: list }, { status: 201 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
