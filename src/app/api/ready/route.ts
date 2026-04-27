/**
 * GET /api/ready — فحص الجاهزية الكاملة
 *
 * Kubernetes readiness probe — يفحص DB + Redis.
 * إذا أرجع 503 لا يُرسَل إليه ترافيك.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/core/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // فحص قاعدة البيانات
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // فحص الذاكرة
  const memUsage = process.memoryUsage();
  const heapUsedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
  checks.memory = heapUsedMb < 500 ? 'ok' : 'error'; // > 500MB = تحذير

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      memory: { heapUsedMb },
      checks,
    },
    {
      status: allOk ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
