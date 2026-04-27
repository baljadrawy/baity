/**
 * GET /api/v1/bills   — قائمة الفواتير مع فلترة وترقيم
 * POST /api/v1/bills  — إنشاء فاتورة جديدة
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold } from '@/core/db/with-household';
import { BillsRepository } from '@/features/bills/api/repository';
import { createBillSchema, billFiltersSchema } from '@/features/bills/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { handleApiError } from '@/core/db/with-household';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) {
      return NextResponse.json({ error: 'طلبات كثيرة، حاول لاحقاً' }, { status: 429 });
    }

    const session = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const filters = billFiltersSchema.parse({
      status: searchParams.get('status') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 20,
    });

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new BillsRepository(session.householdId);
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
    if (!success) {
      return NextResponse.json({ error: 'طلبات كثيرة، حاول لاحقاً' }, { status: 429 });
    }

    const session = await authenticate(req);
    const body = await req.json();
    const data = createBillSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new BillsRepository(session.householdId);
      const bill = await repo.create(data);
      return NextResponse.json({ data: bill }, { status: 201 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
