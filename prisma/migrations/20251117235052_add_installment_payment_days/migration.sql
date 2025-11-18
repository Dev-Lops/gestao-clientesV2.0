-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'CANCELED';

-- DropForeignKey
ALTER TABLE "Finance" DROP CONSTRAINT "Finance_orgId_fkey";

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "installmentPaymentDays" SET DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "thumbUrl" TEXT;

-- CreateIndex
CREATE INDEX "Media_clientId_folderId_idx" ON "Media"("clientId", "folderId");

-- CreateIndex
CREATE INDEX "Media_tags_idx" ON "Media"("tags");

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
