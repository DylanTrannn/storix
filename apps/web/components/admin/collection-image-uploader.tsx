'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Trash2, Upload } from 'lucide-react';
import { Button } from '@storix/ui/button';
import { Input } from '@storix/ui/input';
import { Label } from '@storix/ui/label';
import { presignUploadAction } from '@/lib/actions/admin';
import { uploadFileToPresignedUrl } from '@/lib/storage/r2-browser-upload';

interface CollectionImageUploaderProps {
  value?: string;
  onChange: (url: string | undefined) => void;
}

export function CollectionImageUploader({ value, onChange }: CollectionImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = previewUrl || value;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      const localPreview = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return localPreview;
      });

      try {
        const presign = await presignUploadAction({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          context: 'collection',
        });

        const { url } = await uploadFileToPresignedUrl({
          uploadUrl: presign.uploadUrl,
          publicUrl: presign.publicUrl,
          storageKey: presign.storageKey,
          file,
        });

        onChange(url);
      } catch {
        setError('Failed to upload image.');
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        onChange(undefined);
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  function handleRemove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChange(undefined);
    setError(null);
  }

  return (
    <div className="space-y-3">
      <Label>Collection thumbnail</Label>

      {displayUrl ? (
        <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-3">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={displayUrl}
              alt="Collection thumbnail"
              fill
              className="object-cover"
              unoptimized={!!previewUrl}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {uploading ? 'Uploading…' : 'Thumbnail preview'}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-fit px-2 text-destructive hover:text-destructive"
              disabled={uploading}
              onClick={handleRemove}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-8 transition-colors hover:bg-muted/50">
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">
            {uploading ? 'Uploading…' : 'Upload thumbnail'}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP, GIF up to 5MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = '';
            }}
          />
        </label>
      )}

      <div className="space-y-2">
        <Label htmlFor="imageUrl" className="text-xs text-muted-foreground">
          Or paste image URL
        </Label>
        <Input
          id="imageUrl"
          type="url"
          placeholder="https://..."
          value={value ?? ''}
          onChange={(e) => {
            const next = e.target.value.trim();
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
            onChange(next || undefined);
          }}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
