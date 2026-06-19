'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckoutSchema, type CheckoutInput } from '@storix/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { Label } from '@storix/ui/label';
import { Textarea } from '@storix/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@storix/ui/select';
import {
  checkoutStorefront,
  removeStorefrontCartItem,
  updateStorefrontCartItem,
} from '@/lib/api/storefront';

export function CartItems({
  items,
}: {
  items: { id: string; name: string; quantity: number; price: number }[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateQuantity(id: string, quantity: number) {
    setLoadingId(id);
    try {
      await updateStorefrontCartItem(id, { quantity });
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function removeItem(id: string) {
    setLoadingId(id);
    try {
      await removeStorefrontCartItem(id);
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.id} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              ${(item.price / 100).toFixed(2)} each
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === item.id || item.quantity <= 1}
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
              >
                −
              </Button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === item.id}
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                +
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={loadingId === item.id}
              onClick={() => removeItem(item.id)}
            >
              Remove
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: {
      paymentMethod: 'cash_on_delivery',
      shippingAddress: { country: 'US' },
    },
  });

  const paymentMethod = watch('paymentMethod');

  async function onSubmit(data: CheckoutInput) {
    setError(null);
    try {
      const order = await checkoutStorefront(data);
      router.push(`/orders/${order.id}`);
    } catch {
      setError('Checkout failed. Please check your details and try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Shipping address</h2>
          <div className="mt-4 grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="line1">Address</Label>
              <Input id="line1" {...register('shippingAddress.line1')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line2">Apartment, suite, etc.</Label>
              <Input id="line2" {...register('shippingAddress.line2')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('shippingAddress.city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register('shippingAddress.state')} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input id="postalCode" {...register('shippingAddress.postalCode')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register('shippingAddress.country')} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Payment</h2>
          <div className="mt-4">
            <Select
              value={paymentMethod}
              onValueChange={(v) => setValue('paymentMethod', v as CheckoutInput['paymentMethod'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash_on_delivery">Cash on delivery</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Order notes</Label>
          <Textarea id="notes" rows={4} {...register('notes')} placeholder="Optional" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Placing order…' : 'Place order'}
        </Button>
      </div>
    </form>
  );
}
