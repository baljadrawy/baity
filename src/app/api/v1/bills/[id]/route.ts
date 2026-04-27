/**
 * GET    /api/v1/bills/[id] — جلب فاتورة
 * PATCH  /api/v1/bills/[id] — تحديث فاتورة
 * DELETE /api/v1/bills/[id] — حذف فاتورة (soft delete)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { BillsRepository } from '@/features/bills/api/repository';
import { updateBillSchema } from '@/features/bills/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new BillsRepository(session.householdId);
      const bill = await repo.findById(id);
      if (!bill) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
      return NextResponse.json(bill);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = updateBillSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new BillsRepository(session.householdId);
      // تحقق أن الفاتورة تخص هذا البيت
      const existing = await repo.findById(id);
      if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

      const updated = await repo.update(id, data);
      return NextResponse.json(updated);
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new BillsRepository(session.householdId);
      const existing = await repo.findById(id);
      if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

      await repo.delete(id);
      return new NextResponse(null, { status: 204 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
