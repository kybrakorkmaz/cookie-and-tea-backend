CREATE TYPE "public"."status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "status" DEFAULT 'pending' NOT NULL;