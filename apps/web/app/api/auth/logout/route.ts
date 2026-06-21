import { NextResponse } from 'next/server';
import { clearAuthCookies, getRefreshToken } from '@/lib/auth/cookies';
import { API_REFRESH_COOKIE } from '@/lib/auth/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function POST() {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `${API_REFRESH_COOKIE}=${refreshToken}` },
    }).catch(() => undefined);
  }

  await clearAuthCookies();

  return NextResponse.json({ ok: true });
}
