import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Giỏ hàng', href: '/cart' },
  { label: 'Thanh toán', href: '/checkout' },
  { label: 'Hoàn tất', href: null },
] as const;

interface CheckoutStepsProps {
  current: 1 | 2 | 3;
}

export function CheckoutSteps({ current }: CheckoutStepsProps) {
  return (
    <nav aria-label="Tiến trình đặt hàng" className="mb-8">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((step, index) => {
          const stepNumber = (index + 1) as 1 | 2 | 3;
          const isComplete = stepNumber < current;
          const isCurrent = stepNumber === current;

          return (
            <li key={step.label} className="flex items-center gap-2 sm:gap-4">
              {index > 0 && (
                <span
                  className={cn(
                    'hidden h-px w-8 sm:block sm:w-16',
                    isComplete || isCurrent ? 'bg-primary' : 'bg-border',
                  )}
                  aria-hidden
                />
              )}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isComplete && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isComplete && !isCurrent && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isComplete ? <Check className="size-3.5" strokeWidth={3} /> : stepNumber}
                </span>
                {step.href && !isCurrent ? (
                  <Link
                    href={step.href}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      isComplete ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
