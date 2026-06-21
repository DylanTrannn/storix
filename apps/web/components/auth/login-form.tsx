'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { LoginSchema, type LoginInput, type User } from '@storix/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { Label } from '@storix/ui/label';
import { getPostLoginPath } from '@/lib/auth/redirect';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Login failed');
      }
      const data = (await response.json()) as { user: User };
      const redirect = getPostLoginPath(data.user.role, searchParams.get('redirect'));
      router.push(redirect);
      router.refresh();
    } catch {
      setError('Invalid email or password.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
