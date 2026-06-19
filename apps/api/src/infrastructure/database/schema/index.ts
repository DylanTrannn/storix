import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'customer']);
export const productStatusEnum = pgEnum('product_status', ['draft', 'active', 'archived']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'completed',
  'cancelled',
]);
export const paymentMethodEnum = pgEnum('payment_method', ['cash_on_delivery', 'bank_transfer']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('customer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    line1: varchar('line1', { length: 255 }).notNull(),
    line2: varchar('line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    country: varchar('country', { length: 100 }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('addresses_user_id_idx').on(table.userId)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    status: productStatusEnum('status').notNull().default('draft'),
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    taxonomyCategoryId: varchar('taxonomy_category_id', { length: 255 }),
    taxonomyCategoryPath: text('taxonomy_category_path'),
    categoryAttributes: jsonb('category_attributes').$type<Record<string, string | string[]>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('products_status_idx').on(table.status),
    index('products_slug_idx').on(table.slug),
    index('products_taxonomy_category_id_idx').on(table.taxonomyCategoryId),
  ],
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    storageKey: text('storage_key').notNull().default(''),
    alt: varchar('alt', { length: 255 }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('product_images_product_id_idx').on(table.productId)],
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    price: integer('price').notNull(),
    compareAtPrice: integer('compare_at_price'),
    inventory: integer('inventory').notNull().default(0),
    options: jsonb('options').$type<Record<string, string>>().notNull().default({}),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('product_variants_product_id_idx').on(table.productId)],
);

export const collections = pgTable(
  'collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('collections_slug_idx').on(table.slug)],
);

export const collectionProducts = pgTable(
  'collection_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('collection_products_unique_idx').on(table.collectionId, table.productId),
  ],
);

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    sessionId: varchar('session_id', { length: 255 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('carts_user_id_idx').on(table.userId),
    index('carts_session_id_idx').on(table.sessionId),
  ],
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
  },
  (table) => [
    uniqueIndex('cart_items_cart_variant_unique_idx').on(table.cartId, table.variantId),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    guestEmail: varchar('guest_email', { length: 255 }),
    status: orderStatusEnum('status').notNull().default('pending'),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    shippingAddress: jsonb('shipping_address')
      .$type<{
        line1: string;
        line2?: string | null;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      }>()
      .notNull(),
    notes: text('notes'),
    subtotal: integer('subtotal').notNull(),
    total: integer('total').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_user_id_idx').on(table.userId),
    index('orders_status_idx').on(table.status),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id),
    productName: varchar('product_name', { length: 255 }).notNull(),
    variantName: varchar('variant_name', { length: 255 }),
    price: integer('price').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (table) => [index('order_items_order_id_idx').on(table.orderId)],
);

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('wishlist_items_user_product_unique_idx').on(table.userId, table.productId),
  ],
);

export const storeLocations = pgTable('store_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  phone: varchar('phone', { length: 50 }),
  mapUrl: text('map_url'),
  hours: text('hours'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const taxonomyCategories = pgTable(
  'taxonomy_categories',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    shortId: varchar('short_id', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    fullName: text('full_name').notNull(),
    parentId: varchar('parent_id', { length: 255 }),
    level: integer('level').notNull().default(0),
    isLeaf: boolean('is_leaf').notNull().default(false),
    version: varchar('version', { length: 20 }).notNull().default('2025-09'),
  },
  (table) => [
    index('taxonomy_categories_full_name_idx').on(table.fullName),
    index('taxonomy_categories_parent_id_idx').on(table.parentId),
    index('taxonomy_categories_is_leaf_idx').on(table.isLeaf),
  ],
);

export const taxonomyAttributes = pgTable('taxonomy_attributes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  handle: varchar('handle', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
});

export const taxonomyAttributeValues = pgTable(
  'taxonomy_attribute_values',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    attributeId: varchar('attribute_id', { length: 255 })
      .notNull()
      .references(() => taxonomyAttributes.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
  },
  (table) => [index('taxonomy_attribute_values_attribute_id_idx').on(table.attributeId)],
);

export const taxonomyCategoryAttributes = pgTable(
  'taxonomy_category_attributes',
  {
    categoryId: varchar('category_id', { length: 255 })
      .notNull()
      .references(() => taxonomyCategories.id, { onDelete: 'cascade' }),
    attributeId: varchar('attribute_id', { length: 255 })
      .notNull()
      .references(() => taxonomyAttributes.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('taxonomy_category_attributes_category_id_idx').on(table.categoryId),
    index('taxonomy_category_attributes_attribute_id_idx').on(table.attributeId),
  ],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 512 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('refresh_tokens_user_id_idx').on(table.userId)],
);
