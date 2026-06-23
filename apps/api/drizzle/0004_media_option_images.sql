ALTER TABLE "products" ADD COLUMN "media_option_name" varchar(100);
--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "linked_options" jsonb;
