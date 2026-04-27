/**
 * GET /api/v1/cron/warranty-check
 *
 * نقطة نهاية cron لفحص ضمانات الأجهزة وإرسال إشعارات Telegram.
 * محمية بـ CRON_SECRET header — لا تكشف للعام.
 *
 * يُستدعى من: cron job يومي (مثلاً Vercel Cron أو crontab على Pi)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { runWarrantyCheck } from '@/server/jobs/warranty-check';

export async function GET(req: NextRequest) {
  // التحقق من السر
  const secret = req.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runWarrantyCheck();
    console.log('[cron/warranty-check] done:', result);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[cron/warranty-check] fatal error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
