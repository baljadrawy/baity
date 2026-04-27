/**
 * POST /api/v1/onboarding — إنشاء المنزل واسم المستخدم عند التسجيل الأول
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/core/auth/authenticate';
import { handleApiError } from '@/core/db/with-household';
import { prisma } from '@/core/db';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';

const onboardingSchema = z.object({
  householdName: z.string().min(1).max(100),
  userName: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const { householdName, userName } = onboardingSchema.parse(body);

    // تحديث اسم المستخدم
    await prisma.user.update({
      where: { id: session.userId },
      data: { name: userName },
    });

    // إذا كان لديه household بالفعل، فقط حدّث الاسم
    if (session.householdId) {
      await prisma.household.update({
        where: { id: session.householdId },
        data: { name: householdName },
      });
      return NextResponse.json({ success: true });
    }

    // إنشاء household جديد + ربط المستخدم كـ OWNER
    const household = await prisma.household.create({
      data: {
        name: householdName,
        members: {
          create: {
            userId: session.userId,
            role: 'OWNER',
          },
        },
      },
    });

    return NextResponse.json({ success: true, householdId: household.id }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
