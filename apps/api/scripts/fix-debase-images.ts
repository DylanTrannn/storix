/**
 * Recompress oversized De Base seed images already on R2.
 * Usage: pnpm --filter @storix/api fix:debase-images
 */
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { optimizeSeedImage, MAX_OUTPUT_BYTES } from './seed-image-utils';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function createR2Client() {
  const accountId = requireEnv('R2_ACCOUNT_ID');
  const accessKeyId = requireEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');
  const bucket = process.env.R2_BUCKET ?? 'storix-media';
  const publicUrl = requireEnv('R2_PUBLIC_URL').replace(/\/$/, '');

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  return { client, bucket, publicUrl };
}

async function main() {
  const fixturePath = path.join(
    process.cwd(),
    'src/infrastructure/database/fixtures/debase.seed.ts',
  );
  if (!fs.existsSync(fixturePath)) {
    throw new Error('debase.seed.ts not found — run import:debase first');
  }

  const fixture = fs.readFileSync(fixturePath, 'utf8');
  const storageKeys = [
    ...new Set([...fixture.matchAll(/"storageKey": "(seed\/debase\/[^"]+)"/g)].map((m) => m[1])),
  ];

  const r2 = createR2Client();
  let fixed = 0;

  for (const key of storageKeys) {
    const object = await r2.client.send(
      new GetObjectCommand({ Bucket: r2.bucket, Key: key }),
    );
    const raw = Buffer.from(await object.Body!.transformToByteArray());

    if (raw.length <= MAX_OUTPUT_BYTES) {
      continue;
    }

    console.log(`Recompressing ${key} (${(raw.length / 1_000_000).toFixed(1)}MB)`);
    const { buffer, contentType } = await optimizeSeedImage(raw);
    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    console.log(`  → ${(buffer.length / 1_000_000).toFixed(2)}MB`);
    fixed += 1;
  }

  console.log(`Done. Recompressed ${fixed} images.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
