import { cache } from 'react';
import { headers } from 'next/headers';
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
} from './cookies';
import { INTERNAL_ACCESS_TOKEN_HEADER } from './constants';
import { isAccessTokenExpired } from './jwt';
import { fetchRefreshedTokens } from './refresh';

export const getValidAccessToken = cache(async (): Promise<string | undefined> => {
  const headerStore = await headers();
  const middlewareToken = headerStore.get(INTERNAL_ACCESS_TOKEN_HEADER);
  if (middlewareToken) {
    return middlewareToken;
  }

  const accessToken = await getAccessToken();
  if (accessToken && !isAccessTokenExpired(accessToken)) {
    return accessToken;
  }

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return undefined;
  }

  const tokens = await fetchRefreshedTokens(refreshToken);
  if (!tokens) {
    try {
      await clearAuthCookies();
    } catch {
      // RSC cannot modify cookies
    }
    return undefined;
  }

  // Cookie writes only work in Server Actions / Route Handlers, not during RSC render.
  try {
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);
  } catch {
    // Use refreshed token for this request; middleware persists cookies on navigation.
  }

  return tokens.accessToken;
});
