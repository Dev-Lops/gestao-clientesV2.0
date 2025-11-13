-- Add orgId column to Finance and backfill from related Client
ALTER TABLE "Finance" ADD COLUMN "orgId" TEXT;

-- Backfill orgId using existing client relation
UPDATE "Finance" f
SET "orgId" = c."orgId"
FROM "Client" c
WHERE f."clientId" = c."id";

-- Make orgId required
ALTER TABLE "Finance" ALTER COLUMN "orgId" SET NOT NULL;

-- Add foreign key to Org
ALTER TABLE "Finance"
  ADD CONSTRAINT "Finance_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Allow clientId to be nullable for org-level transactions
ALTER TABLE "Finance" ALTER COLUMN "clientId" DROP NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS "Finance_orgId_date_idx" ON "Finance" ("orgId", "date");
-- Keep existing clientId,date index (created in previous migrations) or create if missing
DO $$ BEGIN
  CREATE INDEX "Finance_clientId_date_idx" ON "Finance" ("clientId", "date");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;
