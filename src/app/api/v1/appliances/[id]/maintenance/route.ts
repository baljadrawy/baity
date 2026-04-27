/**
 * POST /api/v1/appliances/[id]/maintenance — إضافة جدول صيانة
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { AppliancesRepository } from '@/features/appliances/api/repository';
import { createMaintenanceScheduleSchema } from '@/features/appliances/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = createMaintenanceScheduleSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new AppliancesRepository(session.householdId);
      const schedule = await repo.addMaintenanceSchedule(params.id, data);
      return NextResponse.json({ data: schedule }, { status: 201 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
