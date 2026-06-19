import { AddToWishlistSchema } from '@storix/shared';
import { NextResponse } from 'next/server';
import { API_URL, buildApiHeaders } from '@/lib/api/server-proxy';

export async function POST(request: Request) {
  const token = await buildApiHeaders();
  if (!token.get('Authorization')) {
    return NextResponse.json({ message: 'Sign in required' }, { status: 401 });
  }

  try {
    const body = AddToWishlistSchema.parse(await request.json());
    const apiRes = await fetch(`${API_URL}/wishlist/items`, {
      method: 'POST',
      headers: token,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await apiRes.text();
    const data = text ? JSON.parse(text) : null;
    return NextResponse.json(data, { status: apiRes.status });
  } catch {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
}
