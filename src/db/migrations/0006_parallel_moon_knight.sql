CREATE TYPE "public"."action_status" AS ENUM('unread', 'read');--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('comment', 'follow', 'donation');--> statement-breakpoint
CREATE TABLE "actions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "actions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"actor_id" integer NOT NULL,
	"target_user_id" integer NOT NULL,
	"type" "action_type" NOT NULL,
	"post_id" integer,
	"amount" integer,
	"message" text,
	"status" "action_status" DEFAULT 'unread' NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_connect_id" varchar(255);--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actions_target_created_idx" ON "actions" USING btree ("target_user_id","created_at" DESC NULLS LAST);