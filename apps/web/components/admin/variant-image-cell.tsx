'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { presignUploadAction } from '@/lib/actions/admin';
import { uploadFileToPresignedUrl } from '@/lib/storage/r2-browser-upload';
import { cn } from '@/lib/utils';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_SIZE = 5 * 1024 * 1024;

interface VariantImageCellProps {
  imageUrl?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function VariantImageCell({ imageUrl, onChange, disabled }: VariantImageCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_SIZE) {
      setError('Ảnh tối đa 5MB');
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const presign = await presignUploadAction({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        context: 'product',
      });
      const { url } = await uploadFileToPresignedUrl({
        uploadUrl: presign.uploadUrl,
        publicUrl: presign.publicUrl,
        storageKey: presign.storageKey,
        file,
      });
      onChange(url);
    } catch {
      setError('Tải ảnh thất bại');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="group relative">
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-dashed transition-colors',
            imageUrl
              ? 'border-border bg-muted'
              : 'border-border/80 bg-muted/40 hover:border-primary/50 hover:bg-muted/70',
            (disabled || isUploading) && 'cursor-not-allowed opacity-60',
          )}
          aria-label={imageUrl ? 'Đổi ảnh biến thể' : 'Tải ảnh biến thể'}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : imageUrl ? (
            <Image src={imageUrl} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {imageUrl && !isUploading && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-destructive group-hover:opacity-100"
            aria-label="Xóa ảnh"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />

      {error && <p className="max-w-[72px] text-center text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
