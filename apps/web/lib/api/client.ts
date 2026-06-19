import { createStorixClient } from '@storix/sdk';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export function getServerClient(accessToken?: string, cartSessionId?: string) {
  return createStorixClient({
    baseUrl: API_URL,
    getAccessToken: () => accessToken,
    credentials: 'include',
    fetch: (url, init) => {
      const headers = new Headers(init?.headers);
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      if (cartSessionId) {
        const existing = headers.get('Cookie');
        const cartCookie = `cart_session_id=${cartSessionId}`;
        headers.set('Cookie', existing ? `${existing}; ${cartCookie}` : cartCookie);
      }
      return fetch(url, { ...init, headers });
    },
  });
}

export function getBrowserClient() {
  return createStorixClient({
    baseUrl: API_URL,
    credentials: 'include',
  });
}
