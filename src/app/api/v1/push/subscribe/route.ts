/**
 * POST   /api/v1/push/subscribe — تسجيل اشتراك Push للمستخدم الحالي
 * DELETE /api/v1/push/subscribe — إلغاء اشتراك (بـ endpoint)
 *
 * Body POST: { endpoint, keys: { p256dh, auth } } — من PushSubscription.toJSON()
 * Body DELETE: { endpoint }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/core/auth/authenticate';
import { handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { prisma } from '@/core/db';

const subscribeSchema = z.object({
  endpoint: z.string().url().max(500),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(500),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = subscribeSchema.parse(body);
    const userAgent = req.headers.get('user-agent') ?? null;

    // upsert على endpoint (مفتاح uniq)
    await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId: session.userId,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent,
      },
      update: {
        userId: session.userId,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent,
        lastUsedAt: null,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
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

export async function DELETE(req: NextRequest) {
  try {
    const session = await authenticate(req);
    const body = await req.json().catch(() => ({}));
    const { endpoint } = unsubscribeSchema.parse(body);

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.userId },
    });

    return NextResponse.json({ success: true });
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
