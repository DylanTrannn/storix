import { cookies } from 'next/headers';
import { applyAuthCookies, clearAuthCookieValues } from './cookie-options';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from './constants';

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  applyAuthCookies(cookieStore, accessToken, refreshToken);
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  clearAuthCookieValues(cookieStore);
}

export {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
};
