-- Add indexes to speed up common queries
CREATE INDEX IF NOT EXISTS "Task_clientId_status_idx" ON "Task" ("clientId", "status");
CREATE INDEX IF NOT EXISTS "Finance_clientId_date_idx" ON "Finance" ("clientId", "date");
