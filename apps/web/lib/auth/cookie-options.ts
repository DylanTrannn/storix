import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from './constants';

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge?: number;
};

type CookieSetter = {
  set: (name: string, value: string, options?: CookieOptions) => void;
};

export function applyAuthCookies(
  target: CookieSetter,
  accessToken: string,
  refreshToken: string,
): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };

  target.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  target.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookieValues(target: CookieSetter): void {
  target.set(ACCESS_TOKEN_COOKIE, '', { path: '/', maxAge: 0 });
  target.set(REFRESH_TOKEN_COOKIE, '', { path: '/', maxAge: 0 });
}
