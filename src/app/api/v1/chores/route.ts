/**
 * GET  /api/v1/chores  — قائمة المهام الدورية
 * POST /api/v1/chores  — إنشاء مهمة جديدة
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { ChoresRepository } from '@/features/chores/api/repository';
import { createChoreSchema } from '@/features/chores/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const filters = {
      search: searchParams.get('search') ?? undefined,
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 20),
    };

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ChoresRepository(session.householdId);
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
    const data = createChoreSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ChoresRepository(session.householdId);
      const chore = await repo.create(data);
      return NextResponse.json({ data: chore }, { status: 201 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
