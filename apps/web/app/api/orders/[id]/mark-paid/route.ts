import { NextResponse } from 'next/server';
import { API_URL, buildApiHeaders, proxyJsonResponse } from '@/lib/api/server-proxy';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const headers = await buildApiHeaders();
  const apiRes = await fetch(`${API_URL}/orders/${id}/mark-paid`, {
    method: 'POST',
    headers,
    cache: 'no-store',
  });
  return proxyJsonResponse(apiRes);
}
