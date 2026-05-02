/**
 * PATCH  /api/v1/members/[id] — تعديل عضو (OWNER/ADMIN فقط)
 * DELETE /api/v1/members/[id] — حذف عضو (OWNER/ADMIN فقط، لا يمكن حذف OWNER ولا الذات)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/core/auth/authenticate';
import { withRole, handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { MembersRepository } from '@/features/members/api/repository';
import { updateMemberSchema } from '@/features/members/schemas';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function mapBusinessError(code: string | undefined): { status: number; error: string } | null {
  switch (code) {
    case 'NOT_FOUND':
      return { status: 404, error: 'member_not_found' };
    case 'FORBIDDEN':
      return { status: 403, error: 'forbidden_action' };
    case 'CONFLICT':
      return { status: 409, error: 'conflict' };
    default:
      return null;
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { id } = await params;
    const body = await req.json();
    const data = updateMemberSchema.parse(body);

    return await withRole(session.userId, session.householdId, 'ADMIN', async () => {
      const repo = new MembersRepository(session.householdId);
      try {
        const member = await repo.update(id, data);
        return NextResponse.json({ data: member });
      } catch (err) {
        const mapped = mapBusinessError((err as Error & { code?: string }).code);
        if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
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

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { id } = await params;

    return await withRole(session.userId, session.householdId, 'ADMIN', async (membership) => {
      const repo = new MembersRepository(session.householdId);
      try {
        await repo.delete(id, membership.id);
        return NextResponse.json({ success: true });
      } catch (err) {
        const mapped = mapBusinessError((err as Error & { code?: string }).code);
        if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status });
        throw err;
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
