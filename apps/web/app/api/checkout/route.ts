import { CheckoutSchema } from '@storix/shared';
import { NextResponse } from 'next/server';
import { API_URL, buildApiHeaders, proxyJsonResponse } from '@/lib/api/server-proxy';

export async function POST(request: Request) {
  try {
    const body = CheckoutSchema.parse(await request.json());
    const headers = await buildApiHeaders({ 'Content-Type': 'application/json' });
    const apiRes = await fetch(`${API_URL}/orders/checkout`, {
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
