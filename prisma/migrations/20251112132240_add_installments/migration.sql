-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "installmentCount" INTEGER,
ADD COLUMN     "installmentValue" DOUBLE PRECISION,
ADD COLUMN     "isInstallment" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Installment_clientId_dueDate_idx" ON "Installment"("clientId", "dueDate");

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
