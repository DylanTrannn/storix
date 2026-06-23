'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { CreateProductSchema, type CreateProductInput } from '@storix/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { Label } from '@storix/ui/label';
import { Separator } from '@storix/ui/separator';
import { Textarea } from '@storix/ui/textarea';
import { ApiError } from '@storix/sdk';
import {
  createProductAction,
  syncProductImageMetadataAction,
  syncProductVariantsAction,
  updateProductAction,
} from '@/lib/actions/admin';
import {
  ProductImageUploader,
  uploadPendingImagesForProduct,
  type ProductImageItem,
} from '@/components/admin/product-image-uploader';
import {
  VariantMatrixEditor,
  buildVariantsFromProduct,
  ensureVariantsForSave,
  parseVariantDrafts,
  type OptionDimensionDraft,
  type VariantMatrixEditorHandle,
} from '@/components/admin/variant-matrix-editor';
import type { VariantDraft } from '@/components/admin/variant-row';

const ProductFormSchema = CreateProductSchema.omit({ slug: true }).extend({
  slug: z.string().optional(),
});

type ProductFormValues = z.infer<typeof ProductFormSchema>;

interface ProductFormProps {
  productId?: string;
  defaultValues?: Partial<CreateProductInput>;
  initialVariants?: Array<{
    id: string;
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    inventory: number;
    options: Record<string, string>;
    imageUrl?: string | null;
  }>;
  initialImages?: ProductImageItem[];
  initialMediaOptionName?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function deriveSlugForSave(name: string, slugInput?: string, fallback = 'product'): string {
  const trimmedSlug = slugInput?.trim();
  if (trimmedSlug) return trimmedSlug;
  const fromName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return fromName || fallback;
}

function buildDefaultFormValues(defaultValues?: Partial<CreateProductInput>): ProductFormValues {
  return {
    status: 'draft',
    name: defaultValues?.name ?? '',
    slug: defaultValues?.slug,
    description: defaultValues?.description,
    metaTitle: defaultValues?.metaTitle,
    metaDescription: defaultValues?.metaDescription,
  };
}

export function ProductForm({
  productId,
  defaultValues,
  initialVariants = [],
  initialImages = [],
  initialMediaOptionName = null,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const router = useRouter();
  const variantEditorRef = useRef<VariantMatrixEditorHandle>(null);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ProductImageItem[]>(initialImages);
  const [mediaOptionName, setMediaOptionName] = useState<string | null>(initialMediaOptionName);
  const isEditing = Boolean(productId);
  const slugSeed = defaultValues?.slug ?? 'product';

  const initialVariantState = useMemo(
    () => buildVariantsFromProduct(initialVariants, slugSeed),
    [initialVariants, slugSeed],
  );

  const [variants, setVariants] = useState<VariantDraft[]>(initialVariantState.variants);
  const [optionDimensions, setOptionDimensions] = useState<OptionDimensionDraft[]>(
    initialVariantState.optionDimensions,
  );
  const [existingVariantIds] = useState(() => initialVariants.map((v) => v.id));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: buildDefaultFormValues(defaultValues),
  });

  const status = watch('status');
  const watchedSlug = watch('slug');
  const watchedName = watch('name');

  const effectiveProductSlug = useMemo(
    () => deriveSlugForSave(watchedName || '', watchedSlug, slugSeed),
    [watchedName, watchedSlug, slugSeed],
  );

  const mediaOptionValues = useMemo(() => {
    if (!mediaOptionName) return [];
    const dimension = optionDimensions.find((d) => d.name.trim() === mediaOptionName);
    return dimension?.values ?? [];
  }, [mediaOptionName, optionDimensions]);

  async function onSubmit(data: ProductFormValues) {
    setError(null);
    try {
      const flushed = variantEditorRef.current?.flushPendingEdits();
      const saveVariants = flushed?.variants ?? variants;
      const saveDimensions = flushed?.optionDimensions ?? optionDimensions;
      if (flushed) {
        setVariants(flushed.variants);
        setOptionDimensions(flushed.optionDimensions);
      }
      const slug = deriveSlugForSave(data.name, data.slug, slugSeed);
      const syncedVariants = ensureVariantsForSave(saveVariants, saveDimensions, slug);
      const parsedVariants = parseVariantDrafts(syncedVariants, slug, saveDimensions);
      const payload = {
        name: data.name,
        slug: data.slug?.trim() || undefined,
        description: data.description,
        status: data.status,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        mediaOptionName: mediaOptionName ?? null,
      };

      if (isEditing && productId) {
        const product = await updateProductAction(productId, payload);
        const uploadedImages = await uploadPendingImagesForProduct(product.id, images);
        setImages(uploadedImages);
        await syncProductImageMetadataAction(product.id, uploadedImages);
        await syncProductVariantsAction(
          product.id,
          parsedVariants,
          existingVariantIds,
          mediaOptionName,
        );
        onSuccess?.();
        router.refresh();
      } else {
        const product = await createProductAction(payload);
        try {
          await syncProductVariantsAction(product.id, parsedVariants, [], mediaOptionName);
          const uploadedImages = await uploadPendingImagesForProduct(product.id, images);
          setImages(uploadedImages);
          await syncProductImageMetadataAction(product.id, uploadedImages);
        } catch (variantError) {
          setError(
            variantError instanceof Error
              ? `${variantError.message} Sản phẩm đã được tạo — hãy chỉnh sửa để đặt biến thể.`
              : 'Sản phẩm đã tạo nhưng đặt biến thể thất bại. Hãy chỉnh sửa sản phẩm.',
          );
          router.refresh();
          return;
        }
        reset(buildDefaultFormValues({ status: 'draft' }));
        setImages([]);
        setMediaOptionName(null);
        setVariants(buildVariantsFromProduct([], product.slug).variants);
        setOptionDimensions([]);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tên</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" placeholder="Tự động tạo nếu để trống" {...register('slug')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea id="description" rows={3} {...register('description')} />
        </div>

        <ProductImageUploader
          productId={productId}
          images={images}
          onChange={setImages}
          mediaOptionName={mediaOptionName}
          mediaOptionValues={mediaOptionValues}
        />

        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setValue('status', e.target.value as CreateProductInput['status'])}
            className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="draft">Bản nháp</option>
            <option value="active">Đang bán</option>
            <option value="archived">Lưu trữ</option>
          </select>
        </div>
      </section>

      <Separator />

      <section>
        <VariantMatrixEditor
          ref={variantEditorRef}
          productSlug={effectiveProductSlug}
          variants={variants}
          optionDimensions={optionDimensions}
          onVariantsChange={setVariants}
          onOptionDimensionsChange={setOptionDimensions}
          mediaOptionName={mediaOptionName}
          onMediaOptionNameChange={setMediaOptionName}
        />
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
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
