'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateProductSchema, type CreateProductInput } from '@storix/shared';
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
import { createProductAction, updateProductAction } from '@/lib/actions/admin';
import {
  ProductImageUploader,
  uploadPendingImagesForProduct,
  type ProductImageItem,
} from '@/components/admin/product-image-uploader';

interface ProductFormProps {
  productId?: string;
  defaultValues?: Partial<CreateProductInput>;
  initialImages?: ProductImageItem[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({
  productId,
  defaultValues,
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
  } = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      status: 'draft',
      ...defaultValues,
    },
  });

  const status = watch('status');

  async function onSubmit(data: CreateProductInput) {
    setError(null);
    try {
      if (isEditing && productId) {
        await updateProductAction(productId, data);
        await uploadPendingImagesForProduct(productId, images);
        router.push(`/admin/products/${productId}`);
        router.refresh();
      } else {
        const product = await createProductAction(data);
        if (images.some((img) => img.file)) {
          await uploadPendingImagesForProduct(product.id, images);
        }
        reset({ status: 'draft' });
        setImages([]);
        onSuccess?.();
        if (!onSuccess) {
          router.refresh();
        }
      }
    } catch {
      setError('Failed to save product. Please try again.');
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

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register('description')} />
      </div>

      <ProductImageUploader
        productId={productId}
        images={images}
        onChange={setImages}
      />

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
