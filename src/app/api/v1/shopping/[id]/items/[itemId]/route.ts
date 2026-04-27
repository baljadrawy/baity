/**
 * PATCH  /api/v1/shopping/[id]/items/[itemId] — تحديث عنصر
 * DELETE /api/v1/shopping/[id]/items/[itemId] — حذف عنصر
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { ShoppingRepository } from '@/features/shopping/api/repository';
import { updateShoppingItemSchema } from '@/features/shopping/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: { id: string; itemId: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ip = getClientIp(req);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = updateShoppingItemSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ShoppingRepository(session.householdId);

      // إذا كان التحديث هو تأشير/إلغاء تأشير
      if (data.isChecked === true) {
        const item = await repo.checkItem(params.itemId, session.memberId);
        return NextResponse.json({ data: item });
      }
      if (data.isChecked === false) {
        const item = await repo.uncheckItem(params.itemId);
        return NextResponse.json({ data: item });
      }

      const item = await repo.updateItem(params.itemId, data);
      return NextResponse.json({ data: item });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await authenticate(req);
    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ShoppingRepository(session.householdId);
      await repo.deleteItem(params.itemId);
      return NextResponse.json({ success: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
