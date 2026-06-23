ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_sku_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_product_id_sku_unique" ON "product_variants" ("product_id", "sku");
