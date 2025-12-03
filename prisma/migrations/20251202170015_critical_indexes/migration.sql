-- CreateIndex
CREATE INDEX "Client_orgId_plan_idx" ON "Client"("orgId", "plan");

-- CreateIndex
CREATE INDEX "Client_orgId_mainChannel_idx" ON "Client"("orgId", "mainChannel");

-- CreateIndex
CREATE INDEX "Client_orgId_paymentStatus_idx" ON "Client"("orgId", "paymentStatus");

-- CreateIndex
CREATE INDEX "Finance_orgId_category_idx" ON "Finance"("orgId", "category");

-- CreateIndex
CREATE INDEX "Invoice_clientId_dueDate_idx" ON "Invoice"("clientId", "dueDate");

-- CreateIndex
CREATE INDEX "Task_orgId_status_dueDate_idx" ON "Task"("orgId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Task_assignee_status_idx" ON "Task"("assignee", "status");
