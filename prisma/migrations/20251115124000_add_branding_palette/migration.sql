-- Migration: add_branding_palette
-- Adds the palette JSONB column to the Branding table

ALTER TABLE "Branding"
ADD COLUMN IF NOT EXISTS "palette" JSONB;
