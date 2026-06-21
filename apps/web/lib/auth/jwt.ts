import type { UserRole } from '@storix/shared';

const JWT_EXPIRY_LEEWAY_SECONDS = 30;

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  exp?: number;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    return null;
  }
  if (payload.role !== 'admin' && payload.role !== 'customer') {
    return null;
  }
  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    exp: typeof payload.exp === 'number' ? payload.exp : undefined,
  };
}

export function getRoleFromAccessToken(token: string): UserRole | null {
  return decodeAccessToken(token)?.role ?? null;
}

export function isAccessTokenExpired(
  token: string,
  leewaySeconds = JWT_EXPIRY_LEEWAY_SECONDS,
): boolean {
  const payload = decodeAccessToken(token) ?? decodeJwtPayload(token);
  const exp = payload && 'exp' in payload ? payload.exp : undefined;
  if (typeof exp !== 'number') return true;
  return Date.now() / 1000 >= exp - leewaySeconds;
}
