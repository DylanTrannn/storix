const JWT_EXPIRY_LEEWAY_SECONDS = 30;

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

export function isAccessTokenExpired(
  token: string,
  leewaySeconds = JWT_EXPIRY_LEEWAY_SECONDS,
): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return true;
  return Date.now() / 1000 >= exp - leewaySeconds;
}
