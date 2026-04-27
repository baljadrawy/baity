/**
 * GET /api/v1/chores/leaderboard — ترتيب الأعضاء بعدد المهام المنجزة هذا الشهر
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { prisma } from '@/core/db/prisma';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);

    return await withHousehold(session.userId, session.householdId, async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // جلب أعضاء البيت
      const members = await prisma.householdMember.findMany({
        where: { householdId: session.householdId },
        include: { user: { select: { name: true } } },
      });

      // حساب إحصائيات كل عضو هذا الشهر
      const stats = await Promise.all(
        members.map(async (member) => {
          const [executionsThisMonth, pointsThisMonth] = await Promise.all([
            prisma.choreExecution.count({
              where: {
                executedById: member.id,
                executedAt: { gte: monthStart },
                chore: { householdId: session.householdId, deletedAt: null },
              },
            }),
            prisma.choreExecution.aggregate({
              where: {
                executedById: member.id,
                executedAt: { gte: monthStart },
                chore: { householdId: session.householdId, deletedAt: null },
              },
              _sum: { pointsAwarded: true },
            }),
          ]);

          return {
            memberId: member.id,
            name: member.user.name,
            executionsThisMonth,
            pointsThisMonth: pointsThisMonth._sum.pointsAwarded ?? 0,
          };
        })
      );

      // ترتيب حسب عدد الإنجازات
      const ranked = stats
        .sort((a, b) => b.executionsThisMonth - a.executionsThisMonth)
        .map((s, i) => ({ ...s, rank: i + 1 }));

      return NextResponse.json(ranked);
    });
  } catch (err) {
    return handleApiError(err);
  }
}
