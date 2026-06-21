'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckoutSchema, VN_PROVINCES, type Cart, type CheckoutInput } from '@storix/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Banknote, Loader2, MapPin, MessageSquare, Phone, User, type LucideIcon } from 'lucide-react';
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
import { checkoutStorefront } from '@/lib/api/storefront';
import { formatPrice } from '@/lib/utils';
import { CheckoutOrderSummary } from '@/components/checkout/checkout-order-summary';
import { PaymentMethodSelector } from '@/components/checkout/payment-method-selector';
import { cn } from '@/lib/utils';

interface CheckoutFormProps {
  cart: Cart;
}

function FormSection({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border bg-card p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function CheckoutForm({ cart }: CheckoutFormProps) {
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
      shippingAddress: {
        province: undefined,
        street: '',
        ward: '',
      },
    },
  });

  const paymentMethod = watch('paymentMethod');
  const province = watch('shippingAddress.province');

  async function onSubmit(data: CheckoutInput) {
    setError(null);
    try {
      const order = await checkoutStorefront(data);
      if (data.paymentMethod === 'bank_transfer') {
        router.push(`/orders/${order.id}/pay`);
      } else {
        router.push(`/orders/${order.id}`);
      }
    } catch {
      setError('Không thể đặt hàng. Vui lòng kiểm tra lại thông tin và thử lại.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-24 lg:pb-0">
      {/* Mobile order summary */}
      <details className="mb-5 rounded-xl border bg-card lg:hidden">
        <summary className="cursor-pointer px-5 py-4 text-sm font-medium">
          Xem đơn hàng ({cart.itemCount} sản phẩm) — {formatPrice(cart.subtotal)}
        </summary>
        <div className="border-t px-5 py-4">
          <CheckoutOrderSummary cart={cart} paymentMethod={paymentMethod} />
        </div>
      </details>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        {/* Left: form sections */}
        <div className="space-y-5 lg:col-span-3">
          <FormSection title="Thông tin nhận hàng" icon={User}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  {...register('fullName')}
                />
                <FieldError message={errors.fullName?.message} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="0901234567"
                      autoComplete="tel"
                      className="pl-9"
                      {...register('phone')}
                    />
                  </div>
                  <FieldError message={errors.phone?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    autoComplete="email"
                    {...register('email')}
                  />
                  <FieldError message={errors.email?.message} />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Địa chỉ giao hàng" icon={MapPin}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Tỉnh / Thành phố</Label>
                <Select
                  value={province ?? ''}
                  onValueChange={(v) =>
                    setValue('shippingAddress.province', v as CheckoutInput['shippingAddress']['province'], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="province">
                    <SelectValue placeholder="Chọn tỉnh/thành phố" />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start" sideOffset={4}>
                    {VN_PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.shippingAddress?.province?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ward">Phường / Xã</Label>
                <Input
                  id="ward"
                  placeholder="VD: Phường Bến Nghé"
                  autoComplete="address-level3"
                  {...register('shippingAddress.ward')}
                />
                <FieldError message={errors.shippingAddress?.ward?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Số nhà, tên đường</Label>
                <Input
                  id="street"
                  placeholder="VD: 123 Nguyễn Huệ, Quận 1"
                  autoComplete="street-address"
                  {...register('shippingAddress.street')}
                />
                <FieldError message={errors.shippingAddress?.street?.message} />
              </div>

              <p className="text-xs text-muted-foreground">
                Việt Nam · Giao hàng toàn quốc
              </p>
            </div>
          </FormSection>

          <FormSection title="Phương thức thanh toán" icon={Banknote}>
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={(v) => setValue('paymentMethod', v, { shouldValidate: true })}
            />
          </FormSection>

          <FormSection title="Ghi chú đơn hàng" icon={MessageSquare}>
            <div className="space-y-2">
              <Label htmlFor="notes" className="sr-only">
                Ghi chú
              </Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Ghi chú cho người giao hàng (không bắt buộc)"
                {...register('notes')}
              />
            </div>
          </FormSection>
        </div>

        {/* Right: sticky summary (desktop) */}
        <div className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-sm">
            <CheckoutOrderSummary cart={cart} paymentMethod={paymentMethod} />

            {error && (
              <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang xử lý…
                </>
              ) : (
                'Đặt hàng'
              )}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng của cửa hàng.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Tổng thanh toán</p>
            <p className="text-lg font-bold text-primary">{formatPrice(cart.subtotal)}</p>
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting} className="shrink-0 px-8">
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Đặt hàng'
            )}
          </Button>
        </div>
        {error && (
          <p className="mx-auto mt-2 max-w-lg text-center text-xs text-destructive">{error}</p>
        )}
      </div>
    </form>
  );
}
