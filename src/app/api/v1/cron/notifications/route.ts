/**
 * GET /api/v1/cron/notifications
 *
 * نقطة cron لتشغيل dispatcher التنبيهات (bills/chores/maintenance via Telegram).
 * محمية بـ CRON_SECRET header.
 *
 * تُستدعى يومياً من crontab — يُفضّل في وقت معقول للأسرة (مثلاً 9 صباحاً).
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { runNotificationsDispatcher } from '@/server/jobs/notifications-dispatcher';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!process.env['CRON_SECRET'] || secret !== process.env['CRON_SECRET']) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runNotificationsDispatcher();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[cron/notifications] fatal:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
