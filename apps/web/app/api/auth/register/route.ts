import { NextResponse } from 'next/server';
import { RegisterSchema } from '@storix/shared';
import { setAuthCookies } from '@/lib/auth/cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function POST(request: Request) {
  try {
    const body = RegisterSchema.parse(await request.json());

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      return NextResponse.json(
        { message: error?.message ?? 'Registration failed' },
        { status: response.status },
      );
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
