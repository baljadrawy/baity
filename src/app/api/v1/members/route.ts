/**
 * GET  /api/v1/members — قائمة أعضاء المنزل
 * POST /api/v1/members — إضافة عضو (OWNER/ADMIN فقط)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/core/auth/authenticate';
import { withRole, withHousehold, handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { MembersRepository } from '@/features/members/api/repository';
import { createMemberSchema } from '@/features/members/schemas';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new MembersRepository(session.householdId);
      const data = await repo.list();
      return NextResponse.json({ data });
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = createMemberSchema.parse(body);

    return await withRole(session.userId, session.householdId, 'ADMIN', async (membership) => {
      const repo = new MembersRepository(session.householdId);
      try {
        const member = await repo.create(data, membership.id);
        return NextResponse.json({ data: member }, { status: 201 });
      } catch (err) {
        const code = (err as Error & { code?: string }).code;
        if (code === 'CONFLICT') {
          return NextResponse.json({ error: 'member_already_exists' }, { status: 409 });
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
