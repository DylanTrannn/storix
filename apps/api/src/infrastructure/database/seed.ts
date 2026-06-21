import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import {
  whoseStudioCollections,
  whoseStudioProducts,
} from './fixtures/whose-studio.seed';
import {
  collectionProducts,
  collections,
  productImages,
  products,
  productVariants,
  users,
} from './schema';

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

  const productIdBySlug = new Map<string, string>();

  for (const product of whoseStudioProducts) {
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.slug, product.slug))
      .limit(1);

    if (existing) {
      productIdBySlug.set(product.slug, existing.id);
      continue;
    }

    const { variants, images, ...productData } = product;
    const [created] = await db.insert(products).values(productData).returning();
    productIdBySlug.set(product.slug, created.id);

    for (const variant of variants) {
      await db
        .insert(productVariants)
        .values({ ...variant, productId: created.id })
        .onConflictDoNothing();
    }

    for (const image of images) {
      await db.insert(productImages).values({ ...image, productId: created.id });
    }

    console.log(`Created product: ${product.name}`);
  }

  for (const collection of whoseStudioCollections) {
    const [existing] = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, collection.slug))
      .limit(1);

    let collectionId = existing?.id;

    if (!existing) {
      const { productSlugs, ...collectionData } = collection;
      const [created] = await db.insert(collections).values(collectionData).returning();
      collectionId = created.id;
      console.log(`Created collection: ${collection.name}`);
    }

    if (!collectionId) continue;

    for (const productSlug of collection.productSlugs) {
      const productId = productIdBySlug.get(productSlug);
      if (!productId) continue;

      await db
        .insert(collectionProducts)
        .values({ collectionId, productId })
        .onConflictDoNothing();
    }
  }

  console.log('Seeding completed successfully');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
