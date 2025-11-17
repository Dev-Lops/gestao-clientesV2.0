-- Migration: add_branding_thumbUrl
-- Adds the thumbUrl column to the Branding table

ALTER TABLE "Branding"
ADD COLUMN IF NOT EXISTS "thumbUrl" TEXT;
