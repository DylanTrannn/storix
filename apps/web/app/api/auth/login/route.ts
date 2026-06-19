import { NextResponse } from 'next/server';
import { LoginSchema } from '@storix/shared';
import { setAuthCookies } from '@/lib/auth/cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function POST(request: Request) {
  try {
    const body = LoginSchema.parse(await request.json());

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const data = (await response.json()) as {
      user: unknown;
      accessToken: string;
      refreshToken: string;
    };

    await setAuthCookies(data.accessToken, data.refreshToken);

    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
}
