/**
 * POST /api/v1/members/[id]/pin — تعيين/تغيير PIN لطفل (OWNER/ADMIN فقط)
 *
 * Body: { pin: "NNNN" } — 4 أرقام (يُحوَّل من الهندية/الفارسية تلقائياً)
 * يُشفَّر بـ bcrypt rounds=12
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/core/auth/authenticate';
import { withRole, handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { MembersRepository } from '@/features/members/api/repository';
import { setMemberPinSchema } from '@/features/members/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { id } = await params;
    const body = await req.json();
    const { pin } = setMemberPinSchema.parse(body);

    return await withRole(session.userId, session.householdId, 'ADMIN', async () => {
      const repo = new MembersRepository(session.householdId);
      try {
        await repo.setPin(id, pin);
        return NextResponse.json({ success: true });
      } catch (err) {
        const code = (err as Error & { code?: string }).code;
        if (code === 'NOT_FOUND') {
          return NextResponse.json({ error: 'member_not_found' }, { status: 404 });
        }
        if (code === 'FORBIDDEN') {
          return NextResponse.json({ error: 'pin_only_for_children' }, { status: 403 });
        }
        throw err;
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'validation_error', details: error.errors },
        { status: 422 }
      );
    }
    return handleApiError(error);
  }
}
