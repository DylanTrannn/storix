ALTER TABLE "products" ADD COLUMN "taxonomy_category_id" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "taxonomy_category_path" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_attributes" jsonb;--> statement-breakpoint
CREATE INDEX "products_taxonomy_category_id_idx" ON "products" USING btree ("taxonomy_category_id");--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "storage_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE TABLE "taxonomy_categories" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"short_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" text NOT NULL,
	"parent_id" varchar(255),
	"level" integer DEFAULT 0 NOT NULL,
	"is_leaf" boolean DEFAULT false NOT NULL,
	"version" varchar(20) DEFAULT '2025-09' NOT NULL
);--> statement-breakpoint
CREATE INDEX "taxonomy_categories_full_name_idx" ON "taxonomy_categories" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "taxonomy_categories_parent_id_idx" ON "taxonomy_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "taxonomy_categories_is_leaf_idx" ON "taxonomy_categories" USING btree ("is_leaf");--> statement-breakpoint
CREATE TABLE "taxonomy_attributes" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"handle" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text
);--> statement-breakpoint
CREATE TABLE "taxonomy_attribute_values" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"attribute_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL
);--> statement-breakpoint
CREATE INDEX "taxonomy_attribute_values_attribute_id_idx" ON "taxonomy_attribute_values" USING btree ("attribute_id");--> statement-breakpoint
CREATE TABLE "taxonomy_category_attributes" (
	"category_id" varchar(255) NOT NULL,
	"attribute_id" varchar(255) NOT NULL
);--> statement-breakpoint
CREATE INDEX "taxonomy_category_attributes_category_id_idx" ON "taxonomy_category_attributes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "taxonomy_category_attributes_attribute_id_idx" ON "taxonomy_category_attributes" USING btree ("attribute_id");--> statement-breakpoint
ALTER TABLE "taxonomy_attribute_values" ADD CONSTRAINT "taxonomy_attribute_values_attribute_id_taxonomy_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."taxonomy_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxonomy_category_attributes" ADD CONSTRAINT "taxonomy_category_attributes_category_id_taxonomy_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."taxonomy_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxonomy_category_attributes" ADD CONSTRAINT "taxonomy_category_attributes_attribute_id_taxonomy_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."taxonomy_attributes"("id") ON DELETE cascade ON UPDATE no action;
