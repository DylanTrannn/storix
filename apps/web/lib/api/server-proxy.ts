import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth/cookies';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
export const CART_SESSION_COOKIE = 'cart_session_id';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export async function buildApiHeaders(extra?: HeadersInit): Promise<Headers> {
  const headers = new Headers(extra);
  const token = await getAccessToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cookieStore = await cookies();
  const cartSession = cookieStore.get(CART_SESSION_COOKIE)?.value;
  if (cartSession) {
    headers.set('Cookie', `${CART_SESSION_COOKIE}=${cartSession}`);
  }

  return headers;
}

export function applyCartSessionFromApi(nextRes: NextResponse, apiRes: Response) {
  const setCookies =
    typeof apiRes.headers.getSetCookie === 'function'
      ? apiRes.headers.getSetCookie()
      : [apiRes.headers.get('set-cookie')].filter(Boolean) as string[];

  for (const cookie of setCookies) {
    const match = cookie.match(/cart_session_id=([^;]+)/);
    if (match?.[1]) {
      nextRes.cookies.set(CART_SESSION_COOKIE, match[1], {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE,
      });
      return;
    }
  }
}

export async function proxyJsonResponse(apiRes: Response) {
  const text = await apiRes.text();
  const data = text ? JSON.parse(text) : null;
  const nextRes = NextResponse.json(data, { status: apiRes.status });
  applyCartSessionFromApi(nextRes, apiRes);
  return nextRes;
}
