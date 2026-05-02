/**
 * DELETE /api/v1/appliances/[id]/maintenance/[scheduleId] — حذف جدول صيانة
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { AppliancesRepository } from '@/features/appliances/api/repository';

interface Params {
  params: Promise<{ id: string; scheduleId: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { id, scheduleId } = await params;

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new AppliancesRepository(session.householdId);
      try {
        await repo.deleteMaintenanceSchedule(id, scheduleId);
        return NextResponse.json({ success: true });
      } catch (err) {
        if ((err as Error).message === 'schedule_not_found') {
          return NextResponse.json({ error: 'not_found' }, { status: 404 });
        }
        throw err;
      }
    });
  } catch (err) {
    return handleApiError(err);
  }
}
