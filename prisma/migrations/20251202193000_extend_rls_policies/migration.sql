-- Extend RLS policies to Task, Invoice, and Payment

-- Task policies
DO $$ BEGIN
  CREATE POLICY org_isolation_select_task ON "Task"
    FOR SELECT USING ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_update_task ON "Task"
    FOR UPDATE USING ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_insert_task ON "Task"
    FOR INSERT WITH CHECK ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Invoice policies
DO $$ BEGIN
  CREATE POLICY org_isolation_select_invoice ON "Invoice"
    FOR SELECT USING ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_update_invoice ON "Invoice"
    FOR UPDATE USING ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_insert_invoice ON "Invoice"
    FOR INSERT WITH CHECK ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payment policies
DO $$ BEGIN
  CREATE POLICY org_isolation_select_payment ON "Payment"
    FOR SELECT USING ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_update_payment ON "Payment"
    FOR UPDATE USING ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_insert_payment ON "Payment"
    FOR INSERT WITH CHECK ("orgId" = current_setting('app.current_org', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
