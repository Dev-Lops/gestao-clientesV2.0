-- Enable RLS on critical tables
ALTER TABLE "Org" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- Policies for Client (repeat analogously for others as needed)
DO $$ BEGIN
  CREATE POLICY org_isolation_select_client ON "Client"
    FOR SELECT USING ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_update_client ON "Client"
    FOR UPDATE USING ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_insert_client ON "Client"
    FOR INSERT WITH CHECK ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Policies for Media
DO $$ BEGIN
  CREATE POLICY org_isolation_select_media ON "Media"
    FOR SELECT USING ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_update_media ON "Media"
    FOR UPDATE USING ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_insert_media ON "Media"
    FOR INSERT WITH CHECK ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
