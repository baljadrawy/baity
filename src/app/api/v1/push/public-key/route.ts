/**
 * GET /api/v1/push/public-key — يُعيد VAPID public key (إن كان معدّاً)
 *
 * المتصفح يحتاجها قبل `subscribe()` على PushManager.
 * Returns 503 إن لم تُعَدّ المفاتيح بعد (UI يخفي زر التفعيل).
 */

import { NextResponse } from 'next/server';

export function GET() {
  const publicKey = process.env['VAPID_PUBLIC_KEY'];
  if (!publicKey) {
    return NextResponse.json({ error: 'push_not_configured' }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
