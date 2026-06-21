import { API_REFRESH_COOKIE } from './constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function fetchRefreshedTokens(refreshToken: string): Promise<AuthTokens | null> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: `${API_REFRESH_COOKIE}=${refreshToken}` },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };

  if (!data.accessToken || !data.refreshToken) return null;

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}
