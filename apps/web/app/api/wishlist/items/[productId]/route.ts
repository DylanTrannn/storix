import { NextResponse } from 'next/server';
import { API_URL, buildApiHeaders } from '@/lib/api/server-proxy';

interface RouteContext {
  params: Promise<{ productId: string }>;
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const headers = await buildApiHeaders();
  if (!headers.get('Authorization')) {
    return NextResponse.json({ message: 'Sign in required' }, { status: 401 });
  }

  const { productId } = await params;
  const apiRes = await fetch(`${API_URL}/wishlist/items/${productId}`, {
    method: 'DELETE',
    headers,
    cache: 'no-store',
  });

  if (apiRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await apiRes.text();
  const data = text ? JSON.parse(text) : null;
  return NextResponse.json(data, { status: apiRes.status });
}
