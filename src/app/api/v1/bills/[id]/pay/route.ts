/**
 * POST /api/v1/bills/[id]/pay — تسجيل دفع فاتورة
 *
 * بعد الدفع: إذا كانت الفاتورة متكررة → تُولَّد نسخة جديدة تلقائياً
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { BillsRepository } from '@/features/bills/api/repository';
import { payBillSchema } from '@/features/bills/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = payBillSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new BillsRepository(session.householdId);

      const existing = await repo.findById(id);
      if (!existing) {
        return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
      }
      if (existing.status === 'PAID') {
        return NextResponse.json({ error: 'الفاتورة مدفوعة بالفعل' }, { status: 409 });
      }

      const paid = await repo.pay(id, data);

      // إذا كانت الفاتورة متكررة → أنشئ الفاتورة التالية تلقائياً
      let nextBill = null;
      if (existing.isRecurring && existing.recurrencePeriod) {
        nextBill = await repo.generateNextRecurring(existing);
      }

      return NextResponse.json({ data: paid, nextBill }, { status: 200 });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
