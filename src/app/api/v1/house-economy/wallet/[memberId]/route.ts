/**
 * GET   /api/v1/house-economy/wallet/[memberId] — تفاصيل محفظة طفل
 * PATCH /api/v1/house-economy/wallet/[memberId] — تحديث توزيع المحفظة (ولي الأمر)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError, isParent } from '@/core/db/with-household';
import { HouseEconomyRepository } from '@/features/house-economy/api/repository';
import { updateWalletDistributionSchema } from '@/features/house-economy/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: { memberId: string } }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await authenticate(req);
    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new HouseEconomyRepository(session.householdId);
      const wallet = await repo.getChildWallet(params.memberId);
      if (!wallet) return NextResponse.json({ error: 'المحفظة غير موجودة' }, { status: 404 });
      return NextResponse.json({ data: wallet });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = updateWalletDistributionSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async (membership) => {
      if (!isParent(membership.role)) {
        return NextResponse.json({ error: 'ولي الأمر فقط يمكنه تعديل المحفظة' }, { status: 403 });
      }
      const repo = new HouseEconomyRepository(session.householdId);
      const wallet = await repo.updateWalletDistribution(params.memberId, data);
      return NextResponse.json({ data: wallet });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
