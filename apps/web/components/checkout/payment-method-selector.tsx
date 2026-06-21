'use client';

import { Banknote, Building2 } from 'lucide-react';
import type { PaymentMethod } from '@storix/shared';
import { cn } from '@/lib/utils';

const METHODS: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: typeof Banknote;
}[] = [
  {
    value: 'cash_on_delivery',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán bằng tiền mặt khi shipper giao hàng',
    icon: Banknote,
  },
  {
    value: 'bank_transfer',
    label: 'Chuyển khoản ngân hàng',
    description: 'Quét mã VietQR — xác nhận trong vài phút',
    icon: Building2,
  },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {METHODS.map((method) => {
        const Icon = method.icon;
        const selected = value === method.value;

        return (
          <button
            key={method.value}
            type="button"
            onClick={() => onChange(method.value)}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200',
              selected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30',
            )}
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-medium">{method.label}</span>
                <span
                  className={cn(
                    'size-4 shrink-0 rounded-full border-2',
                    selected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                  )}
                  aria-hidden
                >
                  {selected && (
                    <span className="flex size-full items-center justify-center">
                      <span className="size-1.5 rounded-full bg-primary-foreground" />
                    </span>
                  )}
                </span>
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{method.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
