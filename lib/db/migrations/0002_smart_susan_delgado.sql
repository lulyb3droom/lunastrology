ALTER TABLE "tarot_readings" ADD COLUMN "visitor_hash" text;--> statement-breakpoint
CREATE INDEX "tarot_readings_visitor_idx" ON "tarot_readings" USING btree ("visitor_hash");