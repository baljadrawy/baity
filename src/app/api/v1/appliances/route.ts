/**
 * GET  /api/v1/appliances — قائمة الأجهزة
 * POST /api/v1/appliances — إضافة جهاز
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { AppliancesRepository } from '@/features/appliances/api/repository';
import { createApplianceSchema, applianceFiltersSchema } from '@/features/appliances/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const filters = applianceFiltersSchema.parse({
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      warrantyExpiringSoon: searchParams.get('expiringSoon') === 'true',
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 20,
    });

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new AppliancesRepository(session.householdId);
      const result = await repo.list(filters);
      return NextResponse.json(result);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = createApplianceSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new AppliancesRepository(session.householdId);
      const appliance = await repo.create(data);
      return NextResponse.json({ data: appliance }, { status: 201 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
