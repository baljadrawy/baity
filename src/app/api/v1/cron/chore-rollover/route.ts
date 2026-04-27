/**
 * GET /api/v1/cron/chore-rollover — تحديث مواعيد المهام يومياً
 * محمي بـ CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { runChoreRollover } from '@/server/jobs/chore-rollover';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runChoreRollover();
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/chore-rollover]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
