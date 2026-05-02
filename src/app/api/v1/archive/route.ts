/**
 * GET  /api/v1/archive — قائمة وثائق الأرشيف
 * POST /api/v1/archive — إضافة وثيقة (بعد رفع الملف عبر /api/v1/upload)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate } from '@/core/auth/authenticate';
import { withHousehold, handleApiError } from '@/core/db/with-household';
import { rateLimits, getClientIp } from '@/core/security/rate-limit';
import { ArchiveRepository } from '@/features/archive/api/repository';
import {
  createArchiveSchema,
  archiveFiltersSchema,
} from '@/features/archive/schemas';

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const filters = archiveFiltersSchema.parse({
      category: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      expiringSoon: searchParams.get('expiringSoon') === 'true',
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 20,
    });

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ArchiveRepository(session.householdId);
      const result = await repo.list(filters);
      return NextResponse.json(result);
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

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimits.api(ip);
    if (!success) return NextResponse.json({ error: 'rate_limit' }, { status: 429 });

    const session = await authenticate(req);
    const body = await req.json();
    const data = createArchiveSchema.parse(body);

    return await withHousehold(session.userId, session.householdId, async () => {
      const repo = new ArchiveRepository(session.householdId);
      try {
        const item = await repo.create(data, session.memberId);
        return NextResponse.json({ data: item }, { status: 201 });
      } catch (err) {
        if ((err as Error).message === 'invalid_path') {
          return NextResponse.json({ error: 'invalid_path' }, { status: 400 });
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
