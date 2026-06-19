import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-accent p-12 text-accent-foreground lg:flex">
        <Link href="/" className="heading-display text-2xl text-accent-foreground">
          Storix
        </Link>
        <div>
          <p className="section-label text-primary">Join us</p>
          <h1 className="heading-display mt-4 text-4xl leading-tight text-accent-foreground">
            Create an account to save favorites and track orders
          </h1>
          <p className="mt-4 max-w-sm text-stone-400">
            Free to join. Manage your profile, addresses, and order history in one place.
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
          <h2 className="heading-display text-2xl">Create account</h2>
          <p className="mt-2 text-muted-foreground">
            Join Storix to track orders and save favorites.
          </p>
          <div className="mt-8">
            <RegisterForm />
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="cursor-pointer font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
