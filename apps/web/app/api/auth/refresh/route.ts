import { NextResponse } from 'next/server';
import { clearAuthCookies, getRefreshToken, setAuthCookies } from '@/lib/auth/cookies';
import { fetchRefreshedTokens } from '@/lib/auth/refresh';

export async function POST() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const tokens = await fetchRefreshedTokens(refreshToken);
  if (!tokens) {
    await clearAuthCookies();
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await setAuthCookies(tokens.accessToken, tokens.refreshToken);
  return NextResponse.json({ ok: true });
}
