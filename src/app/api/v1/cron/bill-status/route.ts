/**
 * GET /api/v1/cron/bill-status
 *
 * Cron endpoint محمي بـ CRON_SECRET
 * يُستدعى يومياً من cron job على Pi
 *
 * crontab: 0 6 * * * curl -H "x-cron-secret: $SECRET" https://baity.local/api/v1/cron/bill-status
 */

import { NextRequest, NextResponse } from 'next/server';
import { runBillStatusUpdate } from '@/server/jobs/bill-recurrence';

export async function GET(req: NextRequest) {
  // التحقق من الـ secret
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runBillStatusUpdate();
    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/bill-status]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
