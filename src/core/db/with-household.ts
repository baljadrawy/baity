/**
 * withHousehold — Authorization Helper
 *
 * القاعدة الذهبية: كل API route يستخدم هذا الـ helper قبل أي query.
 * يضمن أن المستخدم عضو في البيت المطلوب — لا استثناء.
 *
 * @example
 * export async function GET(req: Request, { params }) {
 *   const session = await authenticate(req);
 *   return withHousehold(session.userId, params.householdId, async (member) => {
 *     const bills = await prisma.bill.findMany({
 *       where: { householdId: member.householdId }
 *     });
 *     return Response.json({ data: bills });
 *   });
 * }
 */

import { type HouseholdMember, type Role } from '@prisma/client';
import { prisma } from './prisma';

// ============================================================
// Custom Errors
// ============================================================

export class ForbiddenError extends Error {
  readonly statusCode = 403;
  constructor(message = 'forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends Error {
  readonly statusCode = 401;
  constructor(message = 'unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message = 'not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

// ============================================================
// withHousehold
// ============================================================

/**
 * يتحقق أن المستخدم عضو في البيت ثم يُنفّذ الـ callback.
 * يرمي ForbiddenError إذا لم يكن عضواً.
 */
export async function withHousehold<T>(
  userId: string,
  householdId: string,
  fn: (membership: HouseholdMember) => Promise<T>
): Promise<T> {
  const membership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId, householdId },
    },
  });

  if (!membership) {
    throw new ForbiddenError('not a member of this household');
  }

  return fn(membership);
}

/**
 * نفس withHousehold لكن يتطلب دور محدد كحد أدنى.
 * ترتيب الأدوار: OWNER > ADMIN > MEMBER > CHILD
 */
export async function withRole<T>(
  userId: string,
  householdId: string,
  minimumRole: Role,
  fn: (membership: HouseholdMember) => Promise<T>
): Promise<T> {
  return withHousehold(userId, householdId, async (membership) => {
    if (!hasRole(membership.role, minimumRole)) {
      throw new ForbiddenError(`requires role: ${minimumRole}`);
    }
    return fn(membership);
  });
}

// ============================================================
// Role Hierarchy
// ============================================================

const ROLE_PRIORITY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  CHILD: 1,
};

/**
 * هل الدور الحالي كافٍ للمتطلبات؟
 */
export function hasRole(currentRole: Role, minimumRole: Role): boolean {
  return ROLE_PRIORITY[currentRole] >= ROLE_PRIORITY[minimumRole];
}

/**
 * هل هو ولي أمر (OWNER أو ADMIN)؟
 */
export function isParent(role: Role): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * هل هو طفل؟
 */
export function isChild(role: Role): boolean {
  return role === 'CHILD';
}

// ============================================================
// Error Handler للـ API Routes
// ============================================================

/**
 * يحوّل الـ errors المعروفة لـ Response JSON مناسبة.
 * الأخطاء غير المتوقّعة (5xx) تُرسَل لـ Sentry للمراجعة.
 */
export function handleApiError(error: unknown): Response {
  if (error instanceof ForbiddenError) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (error instanceof NotFoundError) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }
  // خطأ غير متوقع — أرسل لـ Sentry
  console.error('[API Error]', error);
  // import ديناميكي لتفادي ربط Sentry بالـ Edge runtime عند عدم الحاجة
  import('@sentry/nextjs')
    .then(({ captureException }) => {
      captureException(error);
    })
    .catch(() => {
      /* Sentry غير مُعدّ — تجاهَل */
    });
  return Response.json({ error: 'internal server error' }, { status: 500 });
}
