import { API_URL, buildApiHeaders, proxyJsonResponse } from '@/lib/api/server-proxy';

export async function GET() {
  const headers = await buildApiHeaders();
  const apiRes = await fetch(`${API_URL}/cart`, { headers, cache: 'no-store' });
  return proxyJsonResponse(apiRes);
}
