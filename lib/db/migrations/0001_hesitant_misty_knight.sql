ALTER TABLE "birth_charts" ADD COLUMN "visitor_hash" text;--> statement-breakpoint
ALTER TABLE "geocode_cache" ADD COLUMN "results" jsonb;--> statement-breakpoint
CREATE INDEX "birth_charts_visitor_idx" ON "birth_charts" USING btree ("visitor_hash");