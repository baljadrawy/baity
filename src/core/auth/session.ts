/**
 * Session Types — "بيتي"
 * تعريف الجلسة والـ payload الخاصة بـ JWT
 */

import type { Role } from '@prisma/client';

// ============================================================
// Session Types
// ============================================================

export interface Session {
  userId: string;
  householdId: string;
  memberId: string;
  role: Role;
  name: string;
  /** للأطفال فقط */
  age?: number;
  /** انتهاء صلاحية الـ token */
  exp: number;
  /** وقت إنشاء الـ token */
  iat: number;
}

export interface JwtPayload {
  sub: string;        // userId
  householdId: string;
  memberId: string;
  role: Role;
  name: string;
  age?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;  // ثواني
}

// ============================================================
// Constants
// ============================================================

/** مدة صلاحية Access Token للوالد: 15 دقيقة */
export const PARENT_ACCESS_TOKEN_TTL = 15 * 60;

/** مدة صلاحية Refresh Token للوالد: 30 يوم */
export const PARENT_REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60;

/** مدة صلاحية Token للطفل: 24 ساعة */
export const CHILD_TOKEN_TTL = 24 * 60 * 60;

/** Cookie name للـ session */
export const SESSION_COOKIE = 'baity_session';

/** Cookie name للـ refresh token */
export const REFRESH_COOKIE = 'baity_refresh';
