/**
 * POST /api/v1/chores/[id]/execute — تنفيذ مهمة دورية
 *
 * يُسجّل التنفيذ، يُحدّث الإسناد التالي، ويمنح النقاط إذا وجدت.
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { ChoresRepository } from '@/features/chores/api/repository';
import { executeChoreSchema } from '@/features/chores/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();

    // المُنفِّذ الافتراضي هو المستخدم الحالي
    const data = executeChoreSchema.parse({
      executedBy: session.memberId,
      ...body,
    });

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ChoresRepository(session.householdId);

      const existing = await repo.findById(id);
      if (!existing) {
        return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
      }

      const execution = await repo.execute(id, data, session.memberId);
      return NextResponse.json({ data: execution }, { status: 201 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
