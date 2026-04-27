/**
 * GET /api/v1/achievements/[executionId]/certificate
 * يُنشئ صفحة HTML جاهزة للطباعة كشهادة إنجاز للطفل
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { requireServerSession } from '@/core/auth/server-session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  const { executionId } = await params;
  // مصادقة
  let session;
  try {
    session = await requireServerSession();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // جلب بيانات الإنجاز
  const execution = await prisma.choreExecution.findUnique({
    where: { id: executionId },
    include: {
      chore: {
        select: { name: true, householdId: true },
      },
    },
  });

  if (!execution) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // التحقق من نفس المنزل
  if (execution.chore.householdId !== session.householdId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // جلب اسم المنجز
  const member = await prisma.householdMember.findUnique({
    where: { id: execution.executedById },
    select: { user: { select: { name: true } } },
  });

  const childName = member?.user.name ?? '—';
  const choreName = execution.chore.name;
  const points = execution.pointsAwarded;
  const date = execution.executedAt.toLocaleDateString('ar-SA-u-nu-latn', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // شهادة HTML جاهزة للطباعة
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>شهادة إنجاز — ${childName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Tajawal', 'Arial', sans-serif;
      background: #f0f4ff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }

    .certificate {
      background: #ffffff;
      border: 6px solid #6366f1;
      border-radius: 24px;
      padding: 48px 40px;
      max-width: 680px;
      width: 100%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
      position: relative;
      overflow: hidden;
    }

    .certificate::before {
      content: '';
      position: absolute;
      top: -60px; right: -60px;
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
      border-radius: 50%;
    }

    .badge {
      font-size: 72px;
      margin-bottom: 16px;
      display: block;
    }

    .congratulations {
      font-size: 18px;
      color: #6366f1;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .title {
      font-size: 32px;
      font-weight: 800;
      color: #1e1b4b;
      margin-bottom: 24px;
    }

    .divider {
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      border-radius: 2px;
      margin: 0 auto 24px;
    }

    .body-text {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.8;
      margin-bottom: 8px;
    }

    .child-name {
      font-size: 28px;
      font-weight: 800;
      color: #6366f1;
      margin: 12px 0;
    }

    .chore-name {
      font-size: 22px;
      font-weight: 700;
      color: #1e1b4b;
      background: #eef2ff;
      border-radius: 12px;
      padding: 8px 20px;
      display: inline-block;
      margin: 12px 0;
    }

    .points-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-size: 20px;
      font-weight: 800;
      border-radius: 50px;
      padding: 10px 28px;
      margin: 20px auto;
    }

    .date {
      font-size: 14px;
      color: #9ca3af;
      margin-top: 24px;
    }

    .app-name {
      font-size: 13px;
      color: #d1d5db;
      margin-top: 8px;
      font-weight: 700;
    }

    @media print {
      body { background: white; padding: 0; }
      .certificate { border: 4px solid #6366f1; box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <span class="badge">🏆</span>
    <p class="congratulations">مبروك!</p>
    <h1 class="title">شهادة إنجاز</h1>
    <div class="divider"></div>

    <p class="body-text">يُمنح هذا الوسام إلى</p>
    <p class="child-name">${childName}</p>

    <p class="body-text">لإتمامه بنجاح مهمة</p>
    <p class="chore-name">🌟 ${choreName}</p>

    ${points > 0 ? `
    <p class="body-text" style="margin-top: 16px;">وقد حصل على</p>
    <div class="points-badge">⭐ ${points} نقطة</div>
    ` : ''}

    <p class="date">بتاريخ: ${date}</p>
    <p class="app-name">بيتي — منصة إدارة المنزل العائلي</p>

    <div class="no-print" style="margin-top: 28px;">
      <button
        onclick="window.print()"
        style="background: #6366f1; color: white; border: none; border-radius: 12px;
               padding: 12px 32px; font-size: 16px; font-family: inherit;
               font-weight: 700; cursor: pointer;"
      >
        طباعة / حفظ PDF
      </button>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
