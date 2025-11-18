-- CreateIndex
CREATE INDEX "Client_orgId_status_idx" ON "Client"("orgId", "status");

-- CreateIndex
CREATE INDEX "Client_orgId_createdAt_idx" ON "Client"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Invoice_orgId_dueDate_idx" ON "Invoice"("orgId", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_clientId_status_idx" ON "Invoice"("clientId", "status");

-- CreateIndex
CREATE INDEX "Task_orgId_dueDate_idx" ON "Task"("orgId", "dueDate");
