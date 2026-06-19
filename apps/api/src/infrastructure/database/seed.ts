import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import {
  collectionProducts,
  collections,
  productImages,
  products,
  productVariants,
  storeLocations,
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

  const seedProducts = [
    {
      name: 'Classic Cotton Tee',
      slug: 'classic-cotton-tee',
      description: 'Soft, breathable cotton t-shirt for everyday wear.',
      status: 'active' as const,
      metaTitle: 'Classic Cotton Tee | Storix',
      metaDescription: 'Premium cotton t-shirt available in multiple colors.',
      variants: [
        { sku: 'TEE-BLK-S', price: 2900, inventory: 50, options: { color: 'Black', size: 'S' } },
        { sku: 'TEE-BLK-M', price: 2900, inventory: 75, options: { color: 'Black', size: 'M' } },
        { sku: 'TEE-WHT-M', price: 2900, inventory: 60, options: { color: 'White', size: 'M' } },
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&auto=format&fit=crop',
          alt: 'Classic Cotton Tee',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Minimalist Hoodie',
      slug: 'minimalist-hoodie',
      description: 'Cozy fleece hoodie with a clean, minimal design.',
      status: 'active' as const,
      metaTitle: 'Minimalist Hoodie | Storix',
      metaDescription: 'Premium fleece hoodie for comfort and style.',
      variants: [
        { sku: 'HDG-GRY-M', price: 5900, inventory: 30, options: { color: 'Gray', size: 'M' } },
        { sku: 'HDG-GRY-L', price: 5900, inventory: 25, options: { color: 'Gray', size: 'L' } },
        { sku: 'HDG-NVY-L', price: 5900, compareAtPrice: 6900, inventory: 20, options: { color: 'Navy', size: 'L' } },
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80&auto=format&fit=crop',
          alt: 'Minimalist Hoodie',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Everyday Canvas Tote',
      slug: 'everyday-canvas-tote',
      description: 'Durable canvas tote bag for daily errands and travel.',
      status: 'active' as const,
      metaTitle: 'Everyday Canvas Tote | Storix',
      metaDescription: 'Spacious canvas tote with reinforced handles.',
      variants: [
        { sku: 'TOTE-NAT', price: 3500, inventory: 40, options: { color: 'Natural' } },
        { sku: 'TOTE-BLK', price: 3500, inventory: 35, options: { color: 'Black' } },
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1594223274512-ad480373a029?w=800&q=80&auto=format&fit=crop',
          alt: 'Everyday Canvas Tote',
          sortOrder: 0,
        },
      ],
    },
  ];

  const productIds: string[] = [];

  for (const product of seedProducts) {
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.slug, product.slug))
      .limit(1);

    if (existing) {
      productIds.push(existing.id);
      continue;
    }

    const { variants, images, ...productData } = product;
    const [created] = await db.insert(products).values(productData).returning();
    productIds.push(created.id);

    for (const variant of variants) {
      await db.insert(productVariants).values({ ...variant, productId: created.id });
    }

    for (const image of images) {
      await db.insert(productImages).values({ ...image, storageKey: '', productId: created.id });
    }

    console.log(`Created product: ${product.name}`);
  }

  const seedCollections = [
    {
      name: 'New Arrivals',
      slug: 'new-arrivals',
      description: 'Fresh styles just added to our catalog.',
      imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6bd687551?w=1200&q=80&auto=format&fit=crop',
      productIndexes: [0, 1],
    },
    {
      name: 'Essentials',
      slug: 'essentials',
      description: 'Everyday staples for your wardrobe.',
      imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&q=80&auto=format&fit=crop',
      productIndexes: [0, 2],
    },
  ];

  for (const collection of seedCollections) {
    const [existing] = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, collection.slug))
      .limit(1);

    if (existing) continue;

    const { productIndexes, ...collectionData } = collection;
    const [created] = await db.insert(collections).values(collectionData).returning();

    for (const index of productIndexes) {
      const productId = productIds[index];
      if (productId) {
        await db
          .insert(collectionProducts)
          .values({ collectionId: created.id, productId })
          .onConflictDoNothing();
      }
    }

    console.log(`Created collection: ${collection.name}`);
  }

  const seedLocations = [
    {
      name: 'Storix Flagship Store',
      address: '123 Main Street, San Francisco, CA 94102',
      phone: '+1 (415) 555-0100',
      mapUrl: 'https://maps.google.com/?q=123+Main+Street+San+Francisco',
      hours: 'Mon–Sat 10am–8pm, Sun 11am–6pm',
    },
    {
      name: 'Storix Downtown',
      address: '456 Market Street, San Francisco, CA 94103',
      phone: '+1 (415) 555-0200',
      mapUrl: 'https://maps.google.com/?q=456+Market+Street+San+Francisco',
      hours: 'Mon–Fri 9am–7pm, Sat 10am–6pm',
    },
  ];

  for (const location of seedLocations) {
    const [existing] = await db
      .select()
      .from(storeLocations)
      .where(eq(storeLocations.name, location.name))
      .limit(1);

    if (existing) continue;

    await db.insert(storeLocations).values(location);
    console.log(`Created store location: ${location.name}`);
  }

  console.log('Seeding completed successfully');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
