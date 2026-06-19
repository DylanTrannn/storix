import { UpdateCartItemSchema } from '@storix/shared';
import { NextResponse } from 'next/server';
import { API_URL, buildApiHeaders, proxyJsonResponse } from '@/lib/api/server-proxy';

interface RouteContext {
  params: Promise<{ itemId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { itemId } = await params;
    const body = UpdateCartItemSchema.parse(await request.json());
    const headers = await buildApiHeaders({ 'Content-Type': 'application/json' });
    const apiRes = await fetch(`${API_URL}/cart/items/${itemId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return proxyJsonResponse(apiRes);
  } catch {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { itemId } = await params;
  const headers = await buildApiHeaders();
  const apiRes = await fetch(`${API_URL}/cart/items/${itemId}`, {
    method: 'DELETE',
    headers,
    cache: 'no-store',
  });
  return proxyJsonResponse(apiRes);
}
