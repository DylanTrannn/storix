import Image from 'next/image';
import Link from 'next/link';
import type { OrderItem } from '@storix/shared';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface OrderLineItemsProps {
  items: OrderItem[];
  /** Show quantity as a badge on the image (checkout-style) */
  quantityBadge?: boolean;
  className?: string;
}

function ProductImage({
  item,
  quantityBadge,
  linked,
}: {
  item: OrderItem;
  quantityBadge?: boolean;
  linked?: boolean;
}) {
  const image = (
    <div
      className={cn(
        'relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted',
        linked && 'transition-opacity hover:opacity-80',
      )}
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.productName}
          fill
          className="object-cover"
          sizes="64px"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
          —
        </div>
      )}
      {quantityBadge && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {item.quantity}
        </span>
      )}
    </div>
  );

  if (linked && item.productSlug) {
    return (
      <Link href={`/products/${item.productSlug}`} className="shrink-0">
        {image}
      </Link>
    );
  }

  return image;
}

export function OrderLineItems({ items, quantityBadge, className }: OrderLineItemsProps) {
  return (
    <ul className={cn(quantityBadge ? 'space-y-3' : 'divide-y', className)}>
      {items.map((item) => {
        const hasLink = Boolean(item.productSlug);

        return (
          <li key={item.id} className="flex gap-3 py-3 text-sm first:pt-0 last:pb-0">
            <ProductImage item={item} quantityBadge={quantityBadge} linked={hasLink} />

            <div className="min-w-0 flex-1">
              {hasLink ? (
                <Link
                  href={`/products/${item.productSlug}`}
                  className="line-clamp-2 font-medium leading-snug hover:text-primary hover:underline"
                >
                  {item.productName}
                </Link>
              ) : (
                <p className="line-clamp-2 font-medium leading-snug">{item.productName}</p>
              )}
              {item.variantName && (
                <p className="mt-0.5 text-muted-foreground">{item.variantName}</p>
              )}
              {!quantityBadge && (
                <p className="mt-0.5 text-muted-foreground">SL: {item.quantity}</p>
              )}
            </div>

            <p className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</p>
          </li>
        );
      })}
    </ul>
  );
}
