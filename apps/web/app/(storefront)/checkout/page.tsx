import { CheckoutForm } from '@/components/cart/cart-items';

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold">Checkout</h1>
      <p className="mt-2 text-muted-foreground">Complete your order details below.</p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
