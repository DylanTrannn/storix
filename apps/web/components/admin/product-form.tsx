'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateProductSchema, type CreateProductInput } from '@storix/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { ApiError } from '@storix/sdk';
import {
  createProductAction,
  createProductVariantAction,
  updateProductAction,
  updateProductVariantAction,
} from '@/lib/actions/admin';
import {
  defaultProductSku,
  formatPriceInput,
  getCompareAtPriceFieldLabel,
  getPriceFieldLabel,
  isZeroDecimalCurrency,
  parsePriceInput,
} from '@/lib/admin/product-price';
import {
  ProductImageUploader,
  uploadPendingImagesForProduct,
  type ProductImageItem,
} from '@/components/admin/product-image-uploader';

const ProductFormSchema = CreateProductSchema.extend({
  priceInput: z.string().trim().min(1, 'Price is required'),
  inventoryInput: z.coerce.number().int().min(0, 'Inventory must be 0 or greater'),
  compareAtPriceInput: z.string().optional(),
  sku: z.string().optional(),
});

type ProductFormValues = z.infer<typeof ProductFormSchema>;

interface DefaultVariantValues {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  inventory: number;
}

interface ProductFormProps {
  productId?: string;
  defaultValues?: Partial<CreateProductInput>;
  defaultVariant?: DefaultVariantValues;
  variantCount?: number;
  initialImages?: ProductImageItem[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

function buildDefaultFormValues(
  defaultValues?: Partial<CreateProductInput>,
  defaultVariant?: DefaultVariantValues,
): ProductFormValues {
  return {
    status: 'draft',
    ...defaultValues,
    priceInput: defaultVariant ? formatPriceInput(defaultVariant.price) : '',
    inventoryInput: defaultVariant?.inventory ?? 0,
    compareAtPriceInput: defaultVariant?.compareAtPrice
      ? formatPriceInput(defaultVariant.compareAtPrice)
      : '',
    sku: defaultVariant?.sku ?? '',
  };
}

export function ProductForm({
  productId,
  defaultValues,
  defaultVariant,
  variantCount = defaultVariant ? 1 : 0,
  initialImages = [],
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ProductImageItem[]>(initialImages);
  const isEditing = Boolean(productId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: buildDefaultFormValues(defaultValues, defaultVariant),
  });

  const status = watch('status');
  const priceStep = isZeroDecimalCurrency() ? '1' : '0.01';

  async function saveVariant(productIdForVariant: string, slug: string, data: ProductFormValues) {
    const price = parsePriceInput(data.priceInput);
    if (price === null) {
      throw new Error('Enter a valid price greater than 0.');
    }

    const compareAtRaw = data.compareAtPriceInput?.trim();
    const compareAtPrice = compareAtRaw ? parsePriceInput(compareAtRaw) : undefined;
    if (compareAtRaw && compareAtPrice === null) {
      throw new Error('Enter a valid compare-at price greater than 0.');
    }

    const sku = data.sku?.trim() || defaultProductSku(slug);
    const inventory = data.inventoryInput;

    if (defaultVariant) {
      await updateProductVariantAction(productIdForVariant, defaultVariant.id, {
        sku,
        price,
        compareAtPrice: compareAtPrice ?? null,
        inventory,
      });
      return;
    }

    await createProductVariantAction(productIdForVariant, {
      sku,
      price,
      compareAtPrice,
      inventory,
    });
  }

  async function onSubmit(data: ProductFormValues) {
    setError(null);
    try {
      const payload = {
        name: data.name,
        slug: data.slug?.trim() || undefined,
        description: data.description,
        status: data.status,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      };

      if (isEditing && productId) {
        const product = await updateProductAction(productId, payload);
        await saveVariant(product.id, product.slug, data);
        await uploadPendingImagesForProduct(product.id, images);
        onSuccess?.();
        router.refresh();
      } else {
        const product = await createProductAction(payload);
        try {
          await saveVariant(product.id, product.slug, data);
          if (images.some((img) => img.file)) {
            await uploadPendingImagesForProduct(product.id, images);
          }
        } catch (variantError) {
          setError(
            variantError instanceof Error
              ? `${variantError.message} The product was created — edit it to set pricing.`
              : 'Product created but pricing failed. Edit the product to set a price.',
          );
          onSuccess?.();
          router.refresh();
          return;
        }
        reset(buildDefaultFormValues({ status: 'draft' }));
        setImages([]);
        onSuccess?.();
        if (!onSuccess) {
          router.refresh();
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(
            `${err.message}. Check the products list — a draft with this slug may already exist.`,
          );
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save product. Please try again.');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" placeholder="auto-generated if empty" {...register('slug')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priceInput">{getPriceFieldLabel()}</Label>
          <Input
            id="priceInput"
            type="number"
            min={isZeroDecimalCurrency() ? '1' : '0.01'}
            step={priceStep}
            placeholder={isZeroDecimalCurrency() ? '350000' : '29.99'}
            {...register('priceInput')}
          />
          {errors.priceInput && (
            <p className="text-sm text-destructive">{errors.priceInput.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="inventoryInput">Inventory</Label>
          <Input id="inventoryInput" type="number" min="0" step="1" {...register('inventoryInput')} />
          {errors.inventoryInput && (
            <p className="text-sm text-destructive">{errors.inventoryInput.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="compareAtPriceInput">{getCompareAtPriceFieldLabel()}</Label>
          <Input
            id="compareAtPriceInput"
            type="number"
            min={isZeroDecimalCurrency() ? '1' : '0.01'}
            step={priceStep}
            placeholder="Optional"
            {...register('compareAtPriceInput')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" placeholder="Auto-generated if empty" {...register('sku')} />
        </div>
      </div>

      {variantCount > 1 && (
        <p className="text-xs text-muted-foreground">
          This product has {variantCount} variants. Price and inventory here apply to the primary
          variant only.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register('description')} />
      </div>

      <ProductImageUploader productId={productId} images={images} onChange={setImages} />

      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setValue('status', v as CreateProductInput['status'])}>
          <SelectTrigger className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Update product' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}
