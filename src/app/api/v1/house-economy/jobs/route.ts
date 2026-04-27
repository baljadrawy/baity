/**
 * GET  /api/v1/house-economy/jobs — قائمة أعمال المنيو
 * POST /api/v1/house-economy/jobs — إضافة عمل جديد (ولي الأمر)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError, isParent } from '@/core/db/with-household';
import { HouseEconomyRepository } from '@/features/house-economy/api/repository';
import { createJobMenuItemSchema } from '@/features/house-economy/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const filters = {
      isActive: searchParams.get('isActive') !== 'false',
      childMemberId: searchParams.get('childId') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    };

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new HouseEconomyRepository(session.householdId);
      const items = await repo.listJobMenuItems(filters);
      return NextResponse.json({ data: items });
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
    const data = createJobMenuItemSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async (membership) => {
      if (!isParent(membership.role)) {
        return NextResponse.json({ error: 'ولي الأمر فقط يمكنه إضافة الأعمال' }, { status: 403 });
      }
      const repo = new HouseEconomyRepository(session.householdId);
      const item = await repo.createJobMenuItem(data);
      return NextResponse.json({ data: item }, { status: 201 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
