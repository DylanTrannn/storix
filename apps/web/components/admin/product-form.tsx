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

const ProductFormSchema = CreateProductSchema.omit({ slug: true }).extend({
  slug: z.string().optional(),
  priceInput: z.string().trim().min(1, 'Vui lòng nhập giá'),
  inventoryInput: z.coerce.number().int().min(0, 'Tồn kho phải từ 0 trở lên'),
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
    name: defaultValues?.name ?? '',
    slug: defaultValues?.slug,
    description: defaultValues?.description,
    metaTitle: defaultValues?.metaTitle,
    metaDescription: defaultValues?.metaDescription,
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
      throw new Error('Nhập giá hợp lệ lớn hơn 0.');
    }

    const compareAtRaw = data.compareAtPriceInput?.trim();
    const compareAtPrice = compareAtRaw ? parsePriceInput(compareAtRaw) : undefined;
    if (compareAtRaw && compareAtPrice === null) {
      throw new Error('Nhập giá gốc hợp lệ lớn hơn 0.');
    }
    const compareAtPriceValue = compareAtPrice ?? undefined;

    const sku = data.sku?.trim() || defaultProductSku(slug);
    const inventory = data.inventoryInput;

    if (defaultVariant) {
      await updateProductVariantAction(productIdForVariant, defaultVariant.id, {
        sku,
        price,
        compareAtPrice: compareAtPriceValue,
        inventory,
      });
      return;
    }

    await createProductVariantAction(productIdForVariant, {
      sku,
      price,
      compareAtPrice: compareAtPriceValue,
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
              ? `${variantError.message} Sản phẩm đã được tạo — hãy chỉnh sửa để đặt giá.`
              : 'Sản phẩm đã tạo nhưng đặt giá thất bại. Hãy chỉnh sửa sản phẩm để đặt giá.',
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
            `${err.message}. Kiểm tra danh sách sản phẩm — có thể đã có bản nháp với slug này.`,
          );
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể lưu sản phẩm. Vui lòng thử lại.');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" placeholder="Tự động tạo nếu để trống" {...register('slug')} />
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
          <Label htmlFor="inventoryInput">Tồn kho</Label>
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
            placeholder="Tùy chọn"
            {...register('compareAtPriceInput')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" placeholder="Tự động tạo nếu để trống" {...register('sku')} />
        </div>
      </div>

      {variantCount > 1 && (
        <p className="text-xs text-muted-foreground">
          Sản phẩm này có {variantCount} biến thể. Giá và tồn kho ở đây chỉ áp dụng cho biến thể chính.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea id="description" rows={4} {...register('description')} />
      </div>

      <ProductImageUploader productId={productId} images={images} onChange={setImages} />

      <div className="space-y-2">
        <Label>Trạng thái</Label>
        <Select value={status} onValueChange={(v) => setValue('status', v as CreateProductInput['status'])}>
          <SelectTrigger className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Bản nháp</SelectItem>
            <SelectItem value="active">Đang bán</SelectItem>
            <SelectItem value="archived">Lưu trữ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu…' : isEditing ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
        </Button>
      </div>
    </form>
  );
}
