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

/**
 * يحوّل bytes إلى base64url (مناسب للتوقيع الخام أو UTF-8 strings).
 * `btoa` المباشر يفشل على الأحرف خارج Latin1 (مثل الأرقام العربية) — لذا نمر دائماً عبر bytes.
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlToBytes(data: string): Uint8Array {
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** UTF-8 string → base64url (آمن مع العربية) */
function base64UrlEncode(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

/** base64url → UTF-8 string */
function base64UrlDecode(data: string): string {
  return new TextDecoder().decode(base64UrlToBytes(data));
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

  const sigB64 = bytesToBase64Url(new Uint8Array(signature));
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

  const sigBytes = base64UrlToBytes(signature);
  const sigBuffer = sigBytes.buffer.slice(
    sigBytes.byteOffset,
    sigBytes.byteOffset + sigBytes.byteLength
  ) as ArrayBuffer;
  const valid = await crypto.subtle.verify(
    ALGORITHM,
    key,
    sigBuffer,
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
