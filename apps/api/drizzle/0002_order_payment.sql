CREATE TYPE "public"."payment_status" AS ENUM('pending', 'awaiting_review', 'confirmed', 'rejected', 'not_required');--> statement-breakpoint
CREATE SEQUENCE "public"."orders_order_number_seq";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_number" integer;--> statement-breakpoint
UPDATE "orders" SET "order_number" = nextval('orders_order_number_seq') WHERE "order_number" IS NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "order_number" SET DEFAULT nextval('orders_order_number_seq');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "order_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_order_number_unique" UNIQUE("order_number");--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" "payment_status" DEFAULT 'not_required' NOT NULL;--> statement-breakpoint
UPDATE "orders" SET "payment_status" = 'pending' WHERE "payment_method" = 'bank_transfer';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "transfer_reference" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_marked_paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_confirmed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");
