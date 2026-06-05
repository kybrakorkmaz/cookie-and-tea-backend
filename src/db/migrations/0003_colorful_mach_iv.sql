ALTER TABLE "socials" DROP CONSTRAINT "socials_social_url_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "user_social_url_idx" ON "socials" USING btree ("user_id","social_url");