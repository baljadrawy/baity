/**
 * POST /api/v1/house-economy/wallet/[memberId]/goals — إضافة هدف ادخار
 * (ولي الأمر فقط)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError, isParent } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { HouseEconomyRepository } from '@/features/house-economy/api/repository';
import { createSavingsGoalSchema } from '@/features/house-economy/schemas';

interface Params {
  params: Promise<{ memberId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { memberId } = await params;
    const body = await req.json();
    const data = createSavingsGoalSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async (membership) => {
      if (!isParent(membership.role)) {
        return NextResponse.json({ error: 'parent_only' }, { status: 403 });
      }
      const repo = new HouseEconomyRepository(session.householdId);
      try {
        const goal = await repo.createSavingsGoal(memberId, data);
        return NextResponse.json({ data: goal }, { status: 201 });
      } catch (err) {
        if ((err as Error).message === 'wallet_not_found') {
          return NextResponse.json({ error: 'wallet_not_found' }, { status: 404 });
        }
        throw err;
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'validation_error', details: error.errors },
        { status: 422 }
      );
    }
    return handleApiError(error);
  }
}
