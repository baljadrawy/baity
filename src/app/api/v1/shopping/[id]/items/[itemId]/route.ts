/**
 * PATCH  /api/v1/shopping/[id]/items/[itemId] — تحديث عنصر
 * DELETE /api/v1/shopping/[id]/items/[itemId] — حذف عنصر
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { ShoppingRepository } from '@/features/shopping/api/repository';
import { updateShoppingItemSchema } from '@/features/shopping/schemas';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

interface Params { params: Promise<{ id: string; itemId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { itemId } = await params;
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = updateShoppingItemSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ShoppingRepository(session.householdId);

      // إذا كان التحديث هو تأشير/إلغاء تأشير
      if (data.isChecked === true) {
        const item = await repo.checkItem(itemId, session.memberId);
        return NextResponse.json({ data: item });
      }
      if (data.isChecked === false) {
        const item = await repo.uncheckItem(itemId);
        return NextResponse.json({ data: item });
      }

      const item = await repo.updateItem(itemId, data);
      return NextResponse.json({ data: item });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { itemId } = await params;
  try {
    const session = await authenticate(req);
    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ShoppingRepository(session.householdId);
      await repo.deleteItem(itemId);
      return NextResponse.json({ success: true });
    });
  } catch (err) {
    return handleApiError(err);
  }
}
