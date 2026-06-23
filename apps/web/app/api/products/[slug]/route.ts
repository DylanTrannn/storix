import { NextResponse } from 'next/server';
import { API_URL, buildApiHeaders, proxyJsonResponse } from '@/lib/api/server-proxy';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;

  try {
    const headers = await buildApiHeaders();
    const apiRes = await fetch(`${API_URL}/products/${encodeURIComponent(slug)}`, {
      headers,
      cache: 'no-store',
    });
    return proxyJsonResponse(apiRes);
  } catch {
    return NextResponse.json({ message: 'Failed to load product' }, { status: 500 });
  }
}
