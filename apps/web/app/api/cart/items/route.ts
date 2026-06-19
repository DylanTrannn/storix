import { AddToCartSchema } from '@storix/shared';
import { NextResponse } from 'next/server';
import { API_URL, buildApiHeaders, proxyJsonResponse } from '@/lib/api/server-proxy';

export async function POST(request: Request) {
  try {
    const body = AddToCartSchema.parse(await request.json());
    const headers = await buildApiHeaders({ 'Content-Type': 'application/json' });
    const apiRes = await fetch(`${API_URL}/cart/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return proxyJsonResponse(apiRes);
  } catch {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
}
