ALTER TABLE "pending_donations" DROP CONSTRAINT "pending_donations_donator_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "pending_donations" DROP CONSTRAINT "pending_donations_receiver_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "pending_donations" ADD CONSTRAINT "pending_donations_donator_id_users_id_fk" FOREIGN KEY ("donator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_donations" ADD CONSTRAINT "pending_donations_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;