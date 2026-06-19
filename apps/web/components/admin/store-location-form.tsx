'use client';

import { useState } from 'react';
import { CreateStoreLocationSchema, type CreateStoreLocationInput } from '@storix/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { Label } from '@storix/ui/label';
import { Textarea } from '@storix/ui/textarea';
import { createStoreLocationAction } from '@/lib/actions/admin';

interface StoreLocationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StoreLocationForm({ onSuccess, onCancel }: StoreLocationFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStoreLocationInput>({
    resolver: zodResolver(CreateStoreLocationSchema),
  });

  async function onSubmit(data: CreateStoreLocationInput) {
    setError(null);
    try {
      await createStoreLocationAction(data);
      reset();
      onSuccess?.();
    } catch {
      setError('Failed to create store location.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="store-name">Name</Label>
        <Input id="store-name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="store-address">Address</Label>
        <Textarea id="store-address" rows={2} {...register('address')} />
        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="store-phone">Phone</Label>
        <Input id="store-phone" {...register('phone')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="store-map">Map URL</Label>
        <Input id="store-map" type="url" placeholder="https://maps.google.com/..." {...register('mapUrl')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="store-hours">Hours</Label>
        <Input id="store-hours" placeholder="Mon–Fri 9am–6pm" {...register('hours')} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create location'}
        </Button>
      </div>
    </form>
  );
}
