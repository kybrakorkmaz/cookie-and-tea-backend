CREATE TABLE "pending_donations" (
	"conversation_id" text PRIMARY KEY NOT NULL,
	"donator_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"post_id" integer,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pending_donations" ADD CONSTRAINT "pending_donations_donator_id_users_id_fk" FOREIGN KEY ("donator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_donations" ADD CONSTRAINT "pending_donations_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_donations" ADD CONSTRAINT "pending_donations_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;