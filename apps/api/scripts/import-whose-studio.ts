/**
 * One-time import: fetch Whose Studio (Haravan) catalog, upload images to R2,
 * and emit a static seed fixture.
 *
 * Usage: pnpm --filter @storix/api import:whose-studio
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://whosestudio.vn';
const PRODUCTS_PER_COLLECTION = 5;
const MAX_IMAGES_PER_PRODUCT = 4;

const COLLECTION_SOURCES = [
  { slug: 't-shirts', handle: 'ao-thun', name: 'T-Shirts', description: 'Essential tees and baby tees from Whose Studio.' },
  { slug: 'hoodies', handle: 'hoodie', name: 'Hoodies', description: 'Premium hoodies and zip-ups for everyday streetwear.' },
  { slug: 'jackets', handle: 'jacket', name: 'Jackets', description: 'Outerwear including nylon jackets and windbreakers.' },
  { slug: 'accessories', handle: 'phu-kien', name: 'Accessories', description: 'Caps, scarves, and finishing touches.' },
  { slug: 'jeans', handle: 'wide-straights', name: 'Wide Straight Jeans', description: 'Wide and straight denim fits.' },
] as const;

const BEST_SELLERS_SOURCE = {
  slug: 'best-sellers',
  name: 'Best Sellers',
  description: 'Top picks from the Whose Studio catalog.',
} as const;

/** Curated slugs for best-sellers (cross-collection highlights). */
const BEST_SELLER_SLUGS = [
  'blinkstar-tshirt-black',
  'bodyfit-tee',
  'arch-hoodie-zip',
  'airframe-jacket',
  'wide-straight-jeans-dang-suong-black',
] as const;

const JUNK_HANDLE_PATTERN = /^(san-pham-test|nhan-ban-tu-san-pham-test)/;

interface HaravanImage {
  src: string;
  alt: string | null;
  position: number;
}

interface HaravanVariant {
  option1: string | null;
  option2: string | null;
  option3: string | null;
  price: string;
  compare_at_price: string | null;
  inventory_quantity: number;
  available: boolean;
  sku: string | null;
  title: string;
}

interface HaravanOption {
  name: string;
  position: number;
  values: string[];
}

interface HaravanProduct {
  title: string;
  handle: string;
  body_html: string | null;
  product_type: string;
  images: HaravanImage[];
  options: HaravanOption[];
  variants: HaravanVariant[];
}

interface HaravanProductsResponse {
  products: HaravanProduct[];
}

export interface SeedProductImage {
  url: string;
  storageKey: string;
  alt: string;
  sortOrder: number;
}

export interface SeedProductVariant {
  sku: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  options: Record<string, string>;
}

export interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  status: 'active';
  metaTitle: string;
  metaDescription: string;
  variants: SeedProductVariant[];
  images: SeedProductImage[];
}

export interface SeedCollection {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  productSlugs: string[];
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function createR2Client(): { client: S3Client; bucket: string; publicUrl: string } {
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

function stripHtml(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function slugifySkuPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
    .slice(0, 20) || 'DEFAULT';
}

function normalizeOptionKey(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('size') || lower.includes('kích') || lower === 'size') return 'size';
  if (lower.includes('màu') || lower.includes('color') || lower.includes('colour')) return 'color';
  if (lower.includes('tiêu')) return 'title';
  return slugifySkuPart(name).toLowerCase();
}

function parsePrice(value: string | null | undefined): number | undefined {
  if (!value || value === '0') return undefined;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionsKey(options: Record<string, string>): string {
  return Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
}

const DEMO_INVENTORY_LEVELS = [15, 12, 10, 8, 20, 6];

/** Live store is often sold out; seed with varied demo stock for local dev. */
function resolveInventory(variant: HaravanVariant, index: number): number {
  if (variant.inventory_quantity > 0) return variant.inventory_quantity;
  return DEMO_INVENTORY_LEVELS[index % DEMO_INVENTORY_LEVELS.length];
}

function mapVariants(product: HaravanProduct): SeedProductVariant[] {
  const seenOptionCombos = new Set<string>();
  const usedSkus = new Set<string>();
  const result: SeedProductVariant[] = [];

  for (const [index, variant] of product.variants.entries()) {
    const options: Record<string, string> = {};
    product.options.forEach((opt, optIndex) => {
      const key = normalizeOptionKey(opt.name);
      const value =
        optIndex === 0 ? variant.option1 : optIndex === 1 ? variant.option2 : variant.option3;
      if (value?.trim()) options[key] = value.trim();
    });

    const comboKey = optionsKey(options);
    if (seenOptionCombos.has(comboKey)) continue;
    seenOptionCombos.add(comboKey);

    const skuParts = Object.values(options).map(slugifySkuPart);
    const baseSku = variant.sku?.trim();
    let sku = baseSku
      ? `WHS-${slugifySkuPart(product.handle)}-${baseSku}`
      : `WHS-${slugifySkuPart(product.handle)}-${skuParts.join('-') || String(index)}`;

    if (usedSkus.has(sku)) {
      sku = `${sku}-${index}`;
    }
    usedSkus.add(sku);

    const price = parsePrice(variant.price) ?? 0;
    const compareAtPrice = parsePrice(variant.compare_at_price);

    result.push({
      sku,
      price,
      ...(compareAtPrice && compareAtPrice > price ? { compareAtPrice } : {}),
      inventory: resolveInventory(variant, result.length),
      options,
    });
  }

  return result;
}

function isJunkProduct(product: HaravanProduct): boolean {
  return JUNK_HANDLE_PATTERN.test(product.handle) || !product.images?.length;
}

function guessContentType(url: string): string {
  const lower = url.split('?')[0].toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function extFromContentType(contentType: string): string {
  if (contentType === 'image/png') return '.png';
  if (contentType === 'image/webp') return '.webp';
  if (contentType === 'image/gif') return '.gif';
  return '.jpg';
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const contentType = response.headers.get('content-type')?.split(';')[0] || guessContentType(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, contentType };
}

async function uploadToR2(
  r2: ReturnType<typeof createR2Client>,
  storageKey: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ url: string; storageKey: string }> {
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return { url: `${r2.publicUrl}/${storageKey}`, storageKey };
}

const uploadedImageCache = new Map<string, { url: string; storageKey: string }>();

async function uploadImageFromUrl(
  r2: ReturnType<typeof createR2Client>,
  sourceUrl: string,
  storageKey: string,
): Promise<{ url: string; storageKey: string }> {
  const cached = uploadedImageCache.get(sourceUrl);
  if (cached) return cached;

  const { buffer, contentType } = await downloadImage(sourceUrl);
  const ext = extFromContentType(contentType);
  const finalKey = storageKey.replace(/\.(jpg|jpeg|png|webp|gif)$/i, ext);
  const result = await uploadToR2(r2, finalKey, buffer, contentType);
  uploadedImageCache.set(sourceUrl, result);
  return result;
}

async function fetchCollectionProducts(handle: string): Promise<HaravanProduct[]> {
  const url = `${BASE_URL}/collections/${handle}/products.json?limit=250`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const data = (await response.json()) as HaravanProductsResponse;
  return data.products ?? [];
}

async function transformProduct(
  r2: ReturnType<typeof createR2Client>,
  product: HaravanProduct,
): Promise<SeedProduct> {
  const description =
    stripHtml(product.body_html) ||
    `${product.product_type} from Whose Studio. Premium streetwear for everyday wear.`;

  const images: SeedProductImage[] = [];
  const sortedImages = [...product.images].sort((a, b) => a.position - b.position);

  for (let i = 0; i < Math.min(sortedImages.length, MAX_IMAGES_PER_PRODUCT); i++) {
    const img = sortedImages[i];
    if (!img?.src) continue;
    const storageKey = `seed/products/${product.handle}-${i}.jpg`;
    const uploaded = await uploadImageFromUrl(r2, img.src, storageKey);
    images.push({
      url: uploaded.url,
      storageKey: uploaded.storageKey,
      alt: img.alt?.trim() || product.title,
      sortOrder: i,
    });
    console.log(`  image ${i + 1}/${Math.min(sortedImages.length, MAX_IMAGES_PER_PRODUCT)}`);
  }

  if (images.length === 0) {
    throw new Error(`Product "${product.title}" has no images`);
  }

  const variants = mapVariants(product);
  if (variants.length === 0) {
    throw new Error(`Product "${product.title}" has no variants`);
  }

  return {
    name: product.title,
    slug: product.handle,
    description: description.slice(0, 2000),
    status: 'active',
    metaTitle: `${product.title} | Whose Studio`,
    metaDescription: description.slice(0, 160),
    variants,
    images,
  };
}

function serializeFixture(products: SeedProduct[], collections: SeedCollection[]): string {
  return `/** Auto-generated by scripts/import-whose-studio.ts — do not edit manually. */
/* eslint-disable */

export interface SeedProductImage {
  url: string;
  storageKey: string;
  alt: string;
  sortOrder: number;
}

export interface SeedProductVariant {
  sku: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  options: Record<string, string>;
}

export interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  status: 'active';
  metaTitle: string;
  metaDescription: string;
  variants: SeedProductVariant[];
  images: SeedProductImage[];
}

export interface SeedCollection {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  productSlugs: string[];
}

export const whoseStudioProducts: SeedProduct[] = ${JSON.stringify(products, null, 2)};

export const whoseStudioCollections: SeedCollection[] = ${JSON.stringify(collections, null, 2)};
`;
}

async function main() {
  console.log('Importing Whose Studio catalog...\n');
  const r2 = createR2Client();

  const productsBySlug = new Map<string, SeedProduct>();
  const collections: SeedCollection[] = [];

  for (const source of COLLECTION_SOURCES) {
    console.log(`Fetching collection: ${source.name} (${source.handle})`);
    const haravanProducts = await fetchCollectionProducts(source.handle);
    const pool = haravanProducts.filter((p) => !isJunkProduct(p));
    const productSlugs: string[] = [];

    for (const haravanProduct of pool) {
      if (productSlugs.length >= PRODUCTS_PER_COLLECTION) break;

      if (productsBySlug.has(haravanProduct.handle)) {
        productSlugs.push(haravanProduct.handle);
        continue;
      }

      try {
        console.log(`Processing product: ${haravanProduct.title}`);
        const seedProduct = await transformProduct(r2, haravanProduct);
        productsBySlug.set(seedProduct.slug, seedProduct);
        productSlugs.push(seedProduct.slug);
      } catch (err) {
        console.warn(`  Skipped: ${err instanceof Error ? err.message : err}`);
      }
    }

    const firstSlug = productSlugs.find((slug) => productsBySlug.get(slug)?.images[0]);
    const firstProduct = firstSlug ? productsBySlug.get(firstSlug) : undefined;
    let collectionImageUrl = firstProduct?.images[0]?.url ?? '';

    const heroProduct = pool.find((p) => p.images[0]?.src);
    if (heroProduct?.images[0]?.src) {
      console.log(`Uploading collection thumbnail: ${source.slug}`);
      const uploaded = await uploadImageFromUrl(
        r2,
        heroProduct.images[0].src,
        `seed/collections/${source.slug}.jpg`,
      );
      collectionImageUrl = uploaded.url;
    }

    collections.push({
      name: source.name,
      slug: source.slug,
      description: source.description,
      imageUrl: collectionImageUrl,
      productSlugs,
    });

    console.log(`  → ${productSlugs.length} products linked\n`);
  }

  const bestSellerSlugs = BEST_SELLER_SLUGS.filter((slug) => productsBySlug.has(slug)).slice(
    0,
    PRODUCTS_PER_COLLECTION,
  );
  const bestSellerHero = bestSellerSlugs[0]
    ? productsBySlug.get(bestSellerSlugs[0])
    : undefined;

  collections.push({
    name: BEST_SELLERS_SOURCE.name,
    slug: BEST_SELLERS_SOURCE.slug,
    description: BEST_SELLERS_SOURCE.description,
    imageUrl: bestSellerHero?.images[0]?.url ?? '',
    productSlugs: [...bestSellerSlugs],
  });
  console.log(`Best Sellers: ${bestSellerSlugs.length} curated products\n`);

  const products = Array.from(productsBySlug.values());
  const fixturePath = path.join(
    process.cwd(),
    'src/infrastructure/database/fixtures/whose-studio.seed.ts',
  );

  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(fixturePath, serializeFixture(products, collections), 'utf8');

  const variantCount = products.reduce((sum, p) => sum + p.variants.length, 0);
  console.log(`Done. ${products.length} products, ${variantCount} variants, ${collections.length} collections.`);
  console.log(`Fixture written to ${fixturePath}`);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
