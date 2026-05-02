/**
 * POST /api/v1/appliances/[id]/maintenance/[scheduleId]/log — تسجيل تنفيذ صيانة
 *
 * Body: { cost?: number, notes?: string }
 * يُحدِّث lastDoneAt + nextDueAt للجدول، وينشئ MaintenanceLog
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { AppliancesRepository } from '@/features/appliances/api/repository';

const logSchema = z.object({
  cost: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

interface Params {
  params: Promise<{ id: string; scheduleId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { id, scheduleId } = await params;
    const body = await req.json().catch(() => ({}));
    const data = logSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new AppliancesRepository(session.householdId);
      try {
        await repo.verifyScheduleOwnership(id, scheduleId);
        await repo.logMaintenance(scheduleId, session.memberId, data.cost, data.notes);
        return NextResponse.json({ success: true });
      } catch (err) {
        if ((err as Error).message === 'schedule_not_found') {
          return NextResponse.json({ error: 'not_found' }, { status: 404 });
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
