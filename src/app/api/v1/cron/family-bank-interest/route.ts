/**
 * GET /api/v1/cron/family-bank-interest
 * محمي بـ x-cron-secret — يُشغَّل يوم 1 من كل شهر
 *
 * crontab: 0 6 1 * * curl -H "x-cron-secret: $CRON_SECRET" https://yourdomain.com/api/v1/cron/family-bank-interest
 */

import { NextRequest, NextResponse } from 'next/server';
import { runFamilyBankInterest } from '@/server/jobs/family-bank-interest';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runFamilyBankInterest();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/family-bank-interest]', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
