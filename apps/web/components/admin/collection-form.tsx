'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateCollectionSchema, type CreateCollectionInput } from '@storix/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { Label } from '@storix/ui/label';
import { Textarea } from '@storix/ui/textarea';
import { CollectionImageUploader } from '@/components/admin/collection-image-uploader';
import { createCollectionAction, updateCollectionAction } from '@/lib/actions/admin';

interface CollectionFormProps {
  collectionId?: string;
  defaultValues?: Partial<CreateCollectionInput>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CollectionForm({
  collectionId,
  defaultValues,
  onSuccess,
  onCancel,
}: CollectionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(collectionId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCollectionInput>({
    resolver: zodResolver(CreateCollectionSchema),
    defaultValues,
  });

  async function onSubmit(data: CreateCollectionInput) {
    setError(null);
    try {
      if (isEditing && collectionId) {
        await updateCollectionAction(collectionId, data);
        router.push(`/admin/collections/${collectionId}`);
        router.refresh();
      } else {
        await createCollectionAction(data);
        reset();
        onSuccess?.();
        if (!onSuccess) {
          router.refresh();
        }
      }
    } catch {
      setError('Failed to save collection.');
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
        <Input id="slug" {...register('slug')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...register('description')} />
      </div>
      <Controller
        name="imageUrl"
        control={control}
        render={({ field }) => (
          <CollectionImageUploader value={field.value} onChange={field.onChange} />
        )}
      />
      {errors.imageUrl && (
        <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Update' : 'Create collection'}
        </Button>
      </div>
    </form>
  );
}
