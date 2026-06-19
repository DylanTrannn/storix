'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { GripVertical, Star, Trash2, Upload } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { cn } from '@/lib/utils';
import {
  addProductImagesAction,
  deleteProductImageAction,
  presignUploadAction,
  reorderProductImagesAction,
} from '@/lib/actions/admin';

export interface ProductImageItem {
  id?: string;
  url: string;
  storageKey?: string;
  alt?: string | null;
  sortOrder: number;
  file?: File;
  previewUrl?: string;
  uploading?: boolean;
}

interface ProductImageUploaderProps {
  productId?: string;
  images: ProductImageItem[];
  onChange: (images: ProductImageItem[]) => void;
  maxImages?: number;
}

export function ProductImageUploader({
  productId,
  images,
  onChange,
  maxImages = 10,
}: ProductImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      setError(null);

      const remaining = maxImages - images.length;
      const selected = Array.from(files).slice(0, remaining);

      const newItems: ProductImageItem[] = selected.map((file, index) => ({
        url: '',
        alt: file.name.replace(/\.[^.]+$/, ''),
        sortOrder: images.length + index,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      onChange([...images, ...newItems]);
    },
    [images, maxImages, onChange],
  );

  async function handleRemove(index: number) {
    const image = images[index];
    if (image.id && productId) {
      await deleteProductImageAction(productId, image.id);
    }
    if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    const next = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i }));
    onChange(next);
    if (productId && next.some((img) => img.id)) {
      await reorderProductImagesAction(productId, {
        imageIds: next.filter((img) => img.id).map((img) => img.id!),
      });
    }
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  async function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }

    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    const reordered = next.map((img, i) => ({ ...img, sortOrder: i }));
    onChange(reordered);
    setDragIndex(null);

    if (productId && reordered.some((img) => img.id)) {
      await reorderProductImagesAction(productId, {
        imageIds: reordered.filter((img) => img.id).map((img) => img.id!),
      });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Product images</p>
        <p className="text-xs text-muted-foreground">First image is the thumbnail</p>
      </div>

      {images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {images.map((image, index) => (
            <div
              key={image.id ?? image.previewUrl ?? index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className={cn(
                'flex gap-3 rounded-lg border border-border bg-card p-3',
                dragIndex === index && 'opacity-50',
              )}
            >
              <div className="flex shrink-0 cursor-grab items-center text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {(image.previewUrl || image.url) && (
                  <Image
                    src={image.previewUrl || image.url}
                    alt={image.alt ?? 'Product image'}
                    fill
                    className="object-cover"
                    unoptimized={!!image.previewUrl}
                  />
                )}
                {index === 0 && (
                  <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-primary px-1 py-0.5 text-[10px] font-medium text-primary-foreground">
                    <Star className="h-2.5 w-2.5" />
                    Thumb
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  value={image.alt ?? ''}
                  placeholder="Alt text"
                  onChange={(e) => {
                    const next = [...images];
                    next[index] = { ...next[index], alt: e.target.value };
                    onChange(next);
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-8 transition-colors hover:bg-muted/50">
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">Upload images</span>
          <span className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, WebP, GIF up to 5MB ({images.length}/{maxImages})
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export async function uploadPendingImagesForProduct(
  productId: string,
  images: ProductImageItem[],
): Promise<ProductImageItem[]> {
  const pending = images.filter((img) => img.file);
  if (!pending.length) return images;

  async function uploadFile(file: File) {
    const presign = await presignUploadAction({
      filename: file.name,
      contentType: file.type,
      context: 'product',
    });
    const response = await fetch(presign.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!response.ok) throw new Error('Upload failed');
    return { url: presign.publicUrl, storageKey: presign.storageKey };
  }

  const uploaded: ProductImageItem[] = [];
  for (const img of images) {
    if (!img.file) {
      uploaded.push(img);
      continue;
    }
    const { url, storageKey } = await uploadFile(img.file);
    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    uploaded.push({ ...img, url, storageKey, file: undefined, previewUrl: undefined });
  }

  const toAttach = uploaded.filter((img) => img.storageKey && !img.id);
  if (toAttach.length) {
    const product = await addProductImagesAction(productId, {
      images: toAttach.map((img, index) => ({
        url: img.url,
        storageKey: img.storageKey!,
        alt: img.alt ?? undefined,
        sortOrder: index,
      })),
    });
    return product.images.map((img, index) => ({
      id: img.id,
      url: img.url,
      storageKey: img.storageKey,
      alt: img.alt,
      sortOrder: index,
    }));
  }

  return uploaded;
}
