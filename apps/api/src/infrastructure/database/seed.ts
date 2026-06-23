import * as bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { extractOptionDimensions } from '@storix/shared';
import * as schema from './schema';
import {
  debaseCollections,
  debaseProducts,
  type SeedProductImage,
  type SeedProductVariant,
} from './fixtures/debase.seed';
import {
  whoseStudioCollections,
  whoseStudioProducts,
} from './fixtures/whose-studio.seed';

function getSeedCatalog() {
  if (process.env.SEED_CATALOG === 'whose-studio') {
    return { products: whoseStudioProducts, collections: whoseStudioCollections };
  }
  return { products: debaseProducts, collections: debaseCollections };
}
import {
  cartItems,
  carts,
  collectionProducts,
  collections,
  orderItems,
  productImages,
  products,
  productVariants,
  users,
  wishlistItems,
} from './schema';

const DEMO_INVENTORY_LEVELS = [15, 12, 10, 8, 20, 6];

function resolveSeedInventory(inventory: number, index: number): number {
  if (inventory > 0) return inventory;
  return DEMO_INVENTORY_LEVELS[index % DEMO_INVENTORY_LEVELS.length];
}
function isColorOptionKey(key: string): boolean {
  const lower = key.toLowerCase();
  return lower.includes('color') || lower.includes('màu');
}

function inferMediaOptionName(variants: SeedProductVariant[]): string | null {
  const dimensions = extractOptionDimensions(variants);
  const colorDim = dimensions.find((dim) => isColorOptionKey(dim.name));
  if (colorDim && colorDim.values.length > 1) {
    return colorDim.name;
  }
  return null;
}

function inferLinkedOptions(
  image: SeedProductImage,
  mediaOptionName: string | null,
  variants: SeedProductVariant[],
): Record<string, string> | null {
  if (!mediaOptionName || !image.alt?.trim()) return null;

  const dimensions = extractOptionDimensions(variants);
  const dimension = dimensions.find((dim) => dim.name === mediaOptionName);
  if (!dimension?.values.includes(image.alt)) return null;

  return { [mediaOptionName]: image.alt };
}

function resolveVariantImageUrl(
  variant: SeedProductVariant,
  images: SeedProductImage[],
): string | undefined {
  const colorValue = Object.entries(variant.options ?? {}).find(([key]) =>
    isColorOptionKey(key),
  )?.[1];
  if (colorValue) {
    const match = images.find((image) => image.alt === colorValue);
    if (match) return match.url;
  }
  return images[0]?.url;
}

async function wipeCatalog(db: ReturnType<typeof drizzle<typeof schema>>) {
  const fresh = process.env.SEED_FRESH !== '0';
  if (!fresh) {
    console.log('SEED_FRESH=0 — skipping catalog wipe');
    return;
  }

  console.log('Wiping catalog tables...');
  await db.delete(orderItems);
  await db.delete(cartItems);
  await db.delete(carts);
  await db.delete(wishlistItems);
  await db.delete(collectionProducts);
  await db.delete(collections);
  await db.delete(productVariants);
  await db.delete(productImages);
  await db.delete(products);
  console.log('Catalog wiped.');
}

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('admin123456', 12);

  const [admin] = await db
    .insert(users)
    .values({
      email: 'admin@storix.local',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    })
    .onConflictDoNothing()
    .returning();

  if (admin) {
    console.log('Created admin user: admin@storix.local / admin123456');
  }

  await wipeCatalog(db);

  const { products: seedProducts, collections: seedCollections } = getSeedCatalog();
  console.log(`Using catalog: ${process.env.SEED_CATALOG === 'whose-studio' ? 'whose-studio' : 'debase'}`);

  const productIdBySlug = new Map<string, string>();

  for (const product of seedProducts) {
    const { variants, images, ...productData } = product;
    const mediaOptionName = inferMediaOptionName(variants);
    const [created] = await db
      .insert(products)
      .values({ ...productData, mediaOptionName })
      .returning();
    productIdBySlug.set(product.slug, created.id);

    for (const [variantIndex, variant] of variants.entries()) {
      await db.insert(productVariants).values({
        ...variant,
        inventory: resolveSeedInventory(variant.inventory, variantIndex),
        productId: created.id,
        imageUrl: resolveVariantImageUrl(variant, images),
      });
    }

    for (const image of images) {
      await db.insert(productImages).values({
        ...image,
        productId: created.id,
        linkedOptions: inferLinkedOptions(image, mediaOptionName, variants),
      });
    }

    console.log(`Created product: ${product.name} (${variants.length} variants)`);
  }

  for (const collection of seedCollections) {
    const { productSlugs, ...collectionData } = collection;
    const [created] = await db.insert(collections).values(collectionData).returning();
    console.log(`Created collection: ${collection.name}`);

    for (const productSlug of productSlugs) {
      const productId = productIdBySlug.get(productSlug);
      if (!productId) continue;

      await db.insert(collectionProducts).values({
        collectionId: created.id,
        productId,
      });
    }
  }

  const variantCount = seedProducts.reduce(
    (sum: number, p: { variants: unknown[] }) => sum + p.variants.length,
    0,
  );
  console.log(
    `Seeding complete. ${seedProducts.length} products, ${variantCount} variants, ${seedCollections.length} collections.`,
  );
  await client.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
