import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-accent p-12 text-accent-foreground lg:flex">
        <Link href="/" className="heading-display text-2xl text-accent-foreground">
          Storix
        </Link>
        <div>
          <p className="section-label text-primary">Welcome back</p>
          <h1 className="heading-display mt-4 text-4xl leading-tight text-accent-foreground">
            Sign in to manage your account and orders
          </h1>
          <p className="mt-4 max-w-sm text-stone-400">
            Access your order history, wishlist, and profile settings.
          </p>
        </div>
        <p className="text-xs text-stone-500">© {new Date().getFullYear()} Storix</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="heading-display text-2xl">
              Storix
            </Link>
          </div>
          <h2 className="heading-display text-2xl">Sign in</h2>
          <p className="mt-2 text-muted-foreground">Welcome back. Sign in to your account.</p>
          <div className="mt-8">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="cursor-pointer font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
