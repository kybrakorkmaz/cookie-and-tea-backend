ALTER TABLE "socials" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "socials" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "verification" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "follows" DROP COLUMN "updated_at";