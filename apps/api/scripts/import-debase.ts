/**
 * Import De Base (debase.vn) catalog via server-rendered product pages,
 * upload images to R2, and emit a static seed fixture.
 *
 * Usage: pnpm --filter @storix/api import:debase
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { optimizeSeedImage, MAX_OUTPUT_BYTES } from './seed-image-utils';

const BASE_URL = 'https://debase.vn';
const PRODUCTS_PER_COLLECTION = 5;
const MAX_IMAGES_PER_PRODUCT = 4;
const FETCH_DELAY_MS = 250;

const DEMO_INVENTORY_LEVELS = [15, 12, 10, 8, 20, 6];

const COLLECTION_SOURCES = [
  { slug: 'new-in', group: 'NEW', name: 'New In', description: 'Latest arrivals from De Base.' },
  { slug: 'tops', group: 'TOP', name: 'Tops', description: 'Shirts, tees, and polos from De Base.' },
  { slug: 'bottoms', group: 'BOTTOM', name: 'Bottoms', description: 'Pants, jeans, and shorts from De Base.' },
  { slug: 'outerwear', group: 'OUTWEAR', name: 'Outerwear', description: 'Jackets and outer layers from De Base.' },
  { slug: 'accessories', group: 'ACC', name: 'Accessories', description: 'Accessories and finishing touches from De Base.' },
] as const;

const BEST_SELLERS_SOURCE = {
  slug: 'best-sellers',
  name: 'Best Sellers',
  description: 'Top picks from the De Base catalog.',
} as const;

const BEST_SELLER_IDS = ['509', '502', '500', '497', '412'] as const;

interface DebaseVariation {
  id: number;
  displayId: string;
  retailPrice: number;
  remainQuantity: number;
  color: string | null;
  size: string | null;
  deleted?: boolean;
}

interface ListingItem {
  id: string;
  name: string;
  price: number;
  thumbUrl: string;
}

interface ParsedProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrls: string[];
  variations: DebaseVariation[];
  colors: string[];
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

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(text: string, id: string): string {
  const base =
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || `debase-${id}`;
  return base;
}

function optionsKey(options: Record<string, string>): string {
  return Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
}

function resolveImageUrl(src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  return `${BASE_URL}${src.startsWith('/') ? src : `/${src}`}`;
}

function getInputValue(html: string, id: string): string | null {
  const match = html.match(new RegExp(`id="${id}"\\s+value="([^"]*)"`, 'i'));
  return match ? decodeHtmlEntities(match[1]) : null;
}

function parseListing(html: string): ListingItem[] {
  const items: ListingItem[] = [];
  const seen = new Set<string>();
  const blocks = html.split('products-inner');

  for (const block of blocks.slice(1)) {
    const id = block.match(/products\?id=(\d+)/)?.[1];
    if (!id || seen.has(id)) continue;

    const name = block.match(/products-title[^>]*>\s*([^<]+)/i)?.[1]?.trim();
    const priceRaw = block.match(/(\d[\d,\.]+)\s*VND/i)?.[1]?.replace(/[,\.]/g, '');
    const thumb = block.match(/<img[^>]+src="([^"]+)"/i)?.[1];

    if (!name || !thumb) continue;

    seen.add(id);
    items.push({
      id,
      name,
      price: priceRaw ? parseInt(priceRaw, 10) : 0,
      thumbUrl: resolveImageUrl(thumb),
    });
  }

  return items;
}

function parseColors(html: string): string[] {
  const colors: string[] = [];
  const colorBlock = html.match(/class="xans-color"[^>]*>\s*<ul[^>]*>([\s\S]*?)<\/ul>/i)?.[1];
  if (!colorBlock) return colors;

  for (const match of colorBlock.matchAll(/id="color-pc-([^"]+)"/gi)) {
    colors.push(decodeHtmlEntities(match[1]).trim());
  }

  return colors;
}

function parseDescription(html: string): string {
  const accordion = html.match(/class="pro-accordion"[\s\S]*?id="accordion"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if (accordion) {
    const text = stripHtml(accordion);
    if (text.length > 20) return text;
  }
  return 'Premium fashion from De Base.';
}

function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  function add(src: string | null | undefined) {
    if (!src?.trim()) return;
    const resolved = resolveImageUrl(decodeHtmlEntities(src.trim()));
    if (seen.has(resolved)) return;
    seen.add(resolved);
    urls.push(resolved);
  }

  add(getInputValue(html, 'product-image'));

  for (const match of html.matchAll(/(?:src|href)="(\/external-images\/[^"]+)"/gi)) {
    add(match[1]);
  }

  for (const match of html.matchAll(
    /(?:src|href)="(https?:\/\/[^"]*(?:pancake|statics\.pancake)[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
  )) {
    add(match[1]);
  }

  return urls;
}

function parseVariations(html: string): DebaseVariation[] {
  const raw = getInputValue(html, 'variations');
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as DebaseVariation[];
    return Array.isArray(parsed) ? parsed.filter((v) => !v.deleted) : [];
  } catch {
    return [];
  }
}

function parseProductDetail(html: string): ParsedProduct {
  const id = getInputValue(html, 'product-id');
  const name = getInputValue(html, 'product-name');
  const priceRaw = getInputValue(html, 'product-price');

  if (!id || !name) {
    throw new Error('Missing product id or name on page');
  }

  const price = priceRaw ? Math.round(parseFloat(priceRaw)) : 0;
  const description = parseDescription(html);
  const imageUrls = extractImageUrls(html);
  const variations = parseVariations(html);
  const colors = parseColors(html);

  if (imageUrls.length === 0) {
    throw new Error(`Product "${name}" has no images`);
  }

  return { id, name, price, description, imageUrls, variations, colors };
}

function mapVariations(
  variations: DebaseVariation[],
  fallbackPrice: number,
  productId: string,
): SeedProductVariant[] {
  const seen = new Set<string>();
  const usedSkus = new Set<string>();
  const result: SeedProductVariant[] = [];

  for (const [index, variation] of variations.entries()) {
    const options: Record<string, string> = {};
    if (variation.color?.trim()) options.color = variation.color.trim();
    if (variation.size?.trim()) options.size = variation.size.trim();

    const comboKey = optionsKey(options);
    if (seen.has(comboKey)) continue;
    seen.add(comboKey);

    let sku = `DBS-${variation.displayId || variation.id}`;
    if (usedSkus.has(sku)) sku = `${sku}-${index}`;
    usedSkus.add(sku);

    const price = variation.retailPrice > 0 ? variation.retailPrice : fallbackPrice;
    const inventory =
      variation.remainQuantity > 0
        ? variation.remainQuantity
        : DEMO_INVENTORY_LEVELS[index % DEMO_INVENTORY_LEVELS.length];

    result.push({ sku, price, inventory, options });
  }

  if (result.length === 0) {
    result.push({
      sku: `DBS-${productId}-DEFAULT`,
      price: fallbackPrice,
      inventory: DEMO_INVENTORY_LEVELS[0],
      options: {},
    });
  }

  return result;
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

const FETCH_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetchWithTimeout(url);
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

  const { buffer: rawBuffer, contentType: rawContentType } = await downloadImage(sourceUrl);
  const shouldOptimize = rawBuffer.length > MAX_OUTPUT_BYTES;
  const { buffer, contentType } = shouldOptimize
    ? await optimizeSeedImage(rawBuffer)
    : { buffer: rawBuffer, contentType: rawContentType };
  const ext = extFromContentType(contentType);
  const finalKey = storageKey.replace(/\.(jpg|jpeg|png|webp|gif)$/i, ext);
  const result = await uploadToR2(r2, finalKey, buffer, contentType);
  uploadedImageCache.set(sourceUrl, result);
  return result;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

async function fetchCollectionListing(group: string): Promise<ListingItem[]> {
  const html = await fetchHtml(`${BASE_URL}/products/group/${group}`);
  return parseListing(html);
}

async function fetchProductById(id: string): Promise<ParsedProduct> {
  const html = await fetchHtml(`${BASE_URL}/products?id=${id}`);
  return parseProductDetail(html);
}

function uniqueSlug(base: string, id: string, used: Set<string>): string {
  let slug = slugify(base, id);
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  slug = `${slug}-${id}`;
  used.add(slug);
  return slug;
}

async function transformProduct(
  r2: ReturnType<typeof createR2Client>,
  parsed: ParsedProduct,
  slug: string,
): Promise<SeedProduct> {
  const images: SeedProductImage[] = [];
  const imageUrls = parsed.imageUrls.slice(0, MAX_IMAGES_PER_PRODUCT);

  for (let i = 0; i < imageUrls.length; i++) {
    const sourceUrl = imageUrls[i];
    const storageKey = `seed/debase/${slug}-${i}.jpg`;
    try {
      const uploaded = await uploadImageFromUrl(r2, sourceUrl, storageKey);
      const alt = parsed.colors[i] ?? parsed.colors[0] ?? parsed.name;
      images.push({
        url: uploaded.url,
        storageKey: uploaded.storageKey,
        alt,
        sortOrder: i,
      });
      console.log(`  image ${i + 1}/${imageUrls.length}`);
    } catch (err) {
      console.warn(
        `  image ${i + 1} skipped: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  if (images.length === 0) {
    throw new Error(`Product "${parsed.name}" has no uploaded images`);
  }

  const variants = mapVariations(parsed.variations, parsed.price, parsed.id);
  const description = parsed.description.slice(0, 2000);

  return {
    name: parsed.name,
    slug,
    description,
    status: 'active',
    metaTitle: `${parsed.name} | De Base`,
    metaDescription: description.slice(0, 160),
    variants,
    images,
  };
}

function serializeFixture(products: SeedProduct[], collections: SeedCollection[]): string {
  return `/** Auto-generated by scripts/import-debase.ts — do not edit manually. */
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

export const debaseProducts: SeedProduct[] = ${JSON.stringify(products, null, 2)};

export const debaseCollections: SeedCollection[] = ${JSON.stringify(collections, null, 2)};
`;
}

async function main() {
  console.log('Importing De Base catalog...\n');
  const r2 = createR2Client();

  const productsBySlug = new Map<string, SeedProduct>();
  const productIdBySlug = new Map<string, string>();
  const usedSlugs = new Set<string>();
  const collections: SeedCollection[] = [];

  async function importProduct(listing: ListingItem): Promise<string | null> {
    const existingSlug = [...productIdBySlug.entries()].find(([, id]) => id === listing.id)?.[0];
    if (existingSlug) return existingSlug;

    await sleep(FETCH_DELAY_MS);
    console.log(`Processing product: ${listing.name} (id=${listing.id})`);
    const parsed = await fetchProductById(listing.id);
    const slug = uniqueSlug(parsed.name, parsed.id, usedSlugs);
    const seedProduct = await transformProduct(r2, parsed, slug);
    productsBySlug.set(slug, seedProduct);
    productIdBySlug.set(slug, listing.id);
    return slug;
  }

  for (const source of COLLECTION_SOURCES) {
    console.log(`Fetching collection: ${source.name} (${source.group})`);
    const listing = await fetchCollectionListing(source.group);
    const productSlugs: string[] = [];

    for (const item of listing) {
      if (productSlugs.length >= PRODUCTS_PER_COLLECTION) break;

      const existingSlug = [...productIdBySlug.entries()].find(([, id]) => id === item.id)?.[0];
      if (existingSlug) {
        productSlugs.push(existingSlug);
        continue;
      }

      try {
        const slug = await importProduct(item);
        if (slug) productSlugs.push(slug);
      } catch (err) {
        console.warn(`  Skipped: ${err instanceof Error ? err.message : err}`);
      }
    }

    let collectionImageUrl = '';
    const hero = listing.find((item) => productSlugs.includes(
      [...productIdBySlug.entries()].find(([, id]) => id === item.id)?.[0] ?? '',
    ));
    if (hero?.thumbUrl) {
      console.log(`Uploading collection thumbnail: ${source.slug}`);
      const uploaded = await uploadImageFromUrl(
        r2,
        hero.thumbUrl,
        `seed/debase/collections/${source.slug}.jpg`,
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
    await sleep(FETCH_DELAY_MS);
  }

  const bestSellerSlugs: string[] = [];
  for (const id of BEST_SELLER_IDS) {
    if (bestSellerSlugs.length >= PRODUCTS_PER_COLLECTION) break;
    const existingSlug = [...productIdBySlug.entries()].find(([, productId]) => productId === id)?.[0];
    if (existingSlug) {
      bestSellerSlugs.push(existingSlug);
      continue;
    }

    try {
      const slug = await importProduct({
        id,
        name: `product-${id}`,
        price: 0,
        thumbUrl: `${BASE_URL}/images/LogoDeBase.png`,
      });
      if (slug) bestSellerSlugs.push(slug);
    } catch (err) {
      console.warn(`  Best seller ${id} skipped: ${err instanceof Error ? err.message : err}`);
    }
  }

  const bestSellerHero = bestSellerSlugs[0] ? productsBySlug.get(bestSellerSlugs[0]) : undefined;
  collections.push({
    name: BEST_SELLERS_SOURCE.name,
    slug: BEST_SELLERS_SOURCE.slug,
    description: BEST_SELLERS_SOURCE.description,
    imageUrl: bestSellerHero?.images[0]?.url ?? '',
    productSlugs: bestSellerSlugs,
  });
  console.log(`Best Sellers: ${bestSellerSlugs.length} curated products\n`);

  const products = Array.from(productsBySlug.values());
  const fixturePath = path.join(
    process.cwd(),
    'src/infrastructure/database/fixtures/debase.seed.ts',
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
