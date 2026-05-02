/**
 * PATCH  /api/v1/house-economy/wallet/[memberId]/goals/[goalId] — تعديل هدف
 * DELETE /api/v1/house-economy/wallet/[memberId]/goals/[goalId] — حذف هدف
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

const updateSavingsGoalSchema = createSavingsGoalSchema.partial();

interface Params {
  params: Promise<{ memberId: string; goalId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { memberId, goalId } = await params;
    const body = await req.json();
    const data = updateSavingsGoalSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async (membership) => {
      if (!isParent(membership.role)) {
        return NextResponse.json({ error: 'parent_only' }, { status: 403 });
      }
      const repo = new HouseEconomyRepository(session.householdId);
      try {
        const goal = await repo.updateSavingsGoal(memberId, goalId, data);
        return NextResponse.json({ data: goal });
      } catch (err) {
        if ((err as Error).message === 'goal_not_found') {
          return NextResponse.json({ error: 'goal_not_found' }, { status: 404 });
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

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { memberId, goalId } = await params;

    return await withHousehold(session.userId, session.householdId, async (membership) => {
      if (!isParent(membership.role)) {
        return NextResponse.json({ error: 'parent_only' }, { status: 403 });
      }
      const repo = new HouseEconomyRepository(session.householdId);
      try {
        await repo.deleteSavingsGoal(memberId, goalId);
        return NextResponse.json({ success: true });
      } catch (err) {
        if ((err as Error).message === 'goal_not_found') {
          return NextResponse.json({ error: 'goal_not_found' }, { status: 404 });
        }
        throw err;
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
