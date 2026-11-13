
-- Preserve existing AI log data while converting text to JSONB.
ALTER TABLE "AILog"
  ADD COLUMN "leadId" INTEGER,
  ADD COLUMN "reason" TEXT,
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'itinerary_generation',
  ADD COLUMN "userId" INTEGER;

ALTER TABLE "AILog"
  ALTER COLUMN "input" TYPE JSONB USING to_jsonb("input"),
  ALTER COLUMN "output" TYPE JSONB USING to_jsonb("output");

-- Add default margin to agent configuration.
ALTER TABLE "AgentConfig"
  ADD COLUMN "default_margin" INTEGER NOT NULL DEFAULT 15;

-- Preserve each existing activities string as one JSON array element.
-- This avoids accidentally splitting activity names containing commas.
ALTER TABLE "ItineraryDay"
  ADD COLUMN "accommodation" TEXT,
  ADD COLUMN "accommodation_cost" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "estimated_cost" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "transport_cost" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ItineraryDay"
  ALTER COLUMN "activities" TYPE JSONB
  USING jsonb_build_array("activities");

-- Add lead fields and indexes.
ALTER TABLE "Lead"
  ADD COLUMN "emailHash" TEXT,
  ADD COLUMN "groupType" TEXT,
  ADD COLUMN "phoneHash" TEXT;

CREATE INDEX "Lead_phoneHash_idx" ON "Lead"("phoneHash");
CREATE INDEX "Lead_emailHash_idx" ON "Lead"("emailHash");
