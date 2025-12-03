-- AlterTable
ALTER TABLE "Finance" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "description" TEXT,
ADD COLUMN     "metadata" JSONB;

-- CreateIndex
CREATE INDEX "Finance_orgId_type_date_idx" ON "Finance"("orgId", "type", "date");

-- CreateIndex
CREATE INDEX "Invoice_orgId_status_updatedAt_idx" ON "Invoice"("orgId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Payment_orgId_paidAt_idx" ON "Payment"("orgId", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_clientId_paidAt_idx" ON "Payment"("clientId", "paidAt");
