/*
  Warnings:

  - A unique constraint covering the columns `[installmentId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Finance" ADD COLUMN     "invoiceId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "installmentId" TEXT;

-- CreateIndex
CREATE INDEX "Finance_invoiceId_idx" ON "Finance"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_installmentId_key" ON "Invoice"("installmentId");

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
