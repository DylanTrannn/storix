import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applyAuthCookies } from '@/lib/auth/cookie-options';
import {
  ACCESS_TOKEN_COOKIE,
  INTERNAL_ACCESS_TOKEN_HEADER,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth/constants';
import { isAccessTokenExpired } from '@/lib/auth/jwt';
import { fetchRefreshedTokens } from '@/lib/auth/refresh';

function stripInternalAuthHeader(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete(INTERNAL_ACCESS_TOKEN_HEADER);
  return headers;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken && isAccessTokenExpired(accessToken)) {
    accessToken = undefined;
  }

  const requestHeaders = stripInternalAuthHeader(request);
  let response: NextResponse | null = null;

  if (!accessToken && refreshToken) {
    const tokens = await fetchRefreshedTokens(refreshToken);
    if (tokens) {
      accessToken = tokens.accessToken;
      requestHeaders.set(INTERNAL_ACCESS_TOKEN_HEADER, tokens.accessToken);
      response = NextResponse.next({ request: { headers: requestHeaders } });
      applyAuthCookies(response.cookies, tokens.accessToken, tokens.refreshToken);
    }
  }

  const hasValidAccess = !!accessToken;
  const isAuthenticated = hasValidAccess || !!refreshToken;

  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/orders');

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  return response ?? NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/wishlist/:path*', '/orders/:path*', '/login', '/register'],
};
