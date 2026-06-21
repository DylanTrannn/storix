import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import path from 'path';

@Injectable()
export class StorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly maxBytes: number;
  private readonly allowedMime: Set<string>;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET') ?? 'storix-media';
    this.publicUrl = (this.config.get<string>('R2_PUBLIC_URL') ?? '').replace(/\/$/, '');
    this.maxBytes = Number(this.config.get<string>('R2_UPLOAD_MAX_BYTES') ?? 5_242_880);
    this.allowedMime = new Set(
      (this.config.get<string>('R2_ALLOWED_MIME') ??
        'image/jpeg,image/png,image/webp,image/gif').split(',').map((m) => m.trim()),
    );

    if (accountId && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
    } else {
      this.client = null;
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.publicUrl.length > 0;
  }

  validateContentType(contentType: string): void {
    if (!this.allowedMime.has(contentType)) {
      throw new Error(`Content type not allowed: ${contentType}`);
    }
  }

  buildStorageKey(context: string, filename: string): string {
    const ext = path.extname(filename).toLowerCase() || '.jpg';
    const safeExt = ext.replace(/[^a-z0-9.]/gi, '') || '.jpg';
    return `${context}/${randomUUID()}${safeExt}`;
  }

  getPublicUrl(storageKey: string): string {
    return `${this.publicUrl}/${storageKey}`;
  }

  resolveStorageKey(storageKey?: string | null, url?: string | null): string | null {
    const key = storageKey?.trim();
    if (key) return key;

    if (!url || !this.publicUrl) return null;

    const prefix = `${this.publicUrl}/`;
    if (!url.startsWith(prefix)) return null;

    const resolved = url.slice(prefix.length);
    return resolved || null;
  }

  async deleteStoredObject(storageKey?: string | null, url?: string | null): Promise<void> {
    const key = this.resolveStorageKey(storageKey, url);
    if (!key) return;

    await this.deleteObject(key).catch(() => undefined);
  }

  async presignUpload(input: {
    filename: string;
    contentType: string;
    context: string;
  }): Promise<{ uploadUrl: string; storageKey: string; publicUrl: string; expiresIn: number }> {
    if (!this.client || !this.publicUrl) {
      throw new Error('R2 storage is not configured');
    }

    this.validateContentType(input.contentType);

    const storageKey = this.buildStorageKey(input.context, input.filename);
    const expiresIn = 600;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: input.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });

    return {
      uploadUrl,
      storageKey,
      publicUrl: this.getPublicUrl(storageKey),
      expiresIn,
    };
  }

  async deleteObject(storageKey: string): Promise<void> {
    if (!this.client) return;

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );
  }
}
