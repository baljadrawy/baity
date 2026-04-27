/**
 * JWT Utilities — "بيتي"
 *
 * يدعم طريقتي التحقق:
 * 1. httpOnly Cookie (للويب) — أكثر أماناً
 * 2. Bearer token في Authorization header (للجوال مستقبلاً)
 *
 * القاعدة: لا localStorage أبداً — httpOnly cookies فقط للويب
 */

import type { JwtPayload, Session, TokenPair } from './session';
import {
  CHILD_TOKEN_TTL,
  PARENT_ACCESS_TOKEN_TTL,
  PARENT_REFRESH_TOKEN_TTL,
} from './session';

// ============================================================
// Sign / Verify — Web Crypto API (Edge-compatible)
// ============================================================

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };

async function getKey(): Promise<CryptoKey> {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET is not set');

  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    ALGORITHM,
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(data: string): string {
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

/**
 * توليد JWT token
 */
export async function signJwt(
  payload: JwtPayload,
  expiresInSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds })
  );

  const key = await getKey();
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    ALGORITHM,
    key,
    encoder.encode(`${header}.${body}`)
  );

  const sigB64 = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  return `${header}.${body}.${sigB64}`;
}

/**
 * التحقق من JWT token وإرجاع الـ payload
 * يرمي Error إذا كان الـ token غير صالح أو منتهي الصلاحية
 */
export async function verifyJwt(token: string): Promise<Session> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid token format');

  const [header, body, signature] = parts as [string, string, string];
  const key = await getKey();
  const encoder = new TextEncoder();

  const valid = await crypto.subtle.verify(
    ALGORITHM,
    key,
    Uint8Array.from(base64UrlDecode(signature), (c) => c.charCodeAt(0)),
    encoder.encode(`${header}.${body}`)
  );

  if (!valid) throw new Error('invalid token signature');

  const payload = JSON.parse(base64UrlDecode(body)) as Session & {
    exp: number;
    sub: string;
  };

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('token expired');
  }

  return {
    userId: payload.sub,
    householdId: payload.householdId,
    memberId: payload.memberId,
    role: payload.role,
    name: payload.name,
    age: payload.age,
    exp: payload.exp,
    iat: payload.iat,
  };
}

/**
 * توليد زوج tokens (access + refresh) للوالد
 */
export async function generateParentTokens(payload: JwtPayload): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    signJwt(payload, PARENT_ACCESS_TOKEN_TTL),
    signJwt({ ...payload, type: 'refresh' } as JwtPayload & { type: string }, PARENT_REFRESH_TOKEN_TTL),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: PARENT_ACCESS_TOKEN_TTL,
  };
}

/**
 * توليد token للطفل (PIN-based، صالح 24 ساعة)
 */
export async function generateChildToken(payload: JwtPayload): Promise<string> {
  return signJwt(payload, CHILD_TOKEN_TTL);
}
