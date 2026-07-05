ALTER TABLE "users" DROP COLUMN "stripe_connect_id";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "iyzico_sub_merchant_key" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "iyzico_card_user_key" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "iyzico_card_token" varchar(255);
