/**
 * POST /api/v1/internal/telegram-link
 *
 * Endpoint داخلي يستدعيه Telegram bot worker لربط chat_id بمستخدم.
 * محمي بـ INTERNAL_SECRET header — لا يُكشف للعام.
 *
 * Body: { phone: string, chatId: string, name?: string }
 * Returns:
 *   200 — مربوط بنجاح
 *   404 — الهاتف غير مسجَّل في DB
 *   401 — السر غير صحيح
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/core/db/prisma';

const linkSchema = z.object({
  phone: z.string().regex(/^05\d{8}$/),
  chatId: z.string().min(1),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  const expected = process.env.INTERNAL_SECRET;

  if (!expected || !secret || secret !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parse = linkSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parse.error.errors },
      { status: 422 }
    );
  }
  const { phone, chatId } = parse.data;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
  }

  // إذا chat_id مربوط بمستخدم آخر، يُلغى الربط القديم تلقائياً (unique constraint)
  await prisma.user.updateMany({
    where: { telegramChatId: chatId, NOT: { id: user.id } },
    data: { telegramChatId: null },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: chatId },
  });

  return NextResponse.json({ ok: true });
}
