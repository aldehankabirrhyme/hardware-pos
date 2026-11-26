/*
  Warnings:

  - The values [SHIPPED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `deliveryChargeInsideDhaka` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryChargeOutsideDhaka` on the `SystemSettings` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('COMPLETED', 'PENDING_VERIFICATION', 'CANCELLED', 'ONLINE_PLACED', 'PENDING', 'ACCEPTED', 'PROCESSING', 'ON_THE_WAY', 'DELIVERED', 'REJECTED', 'DELIVERY_FAILED');
ALTER TABLE "Sale" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Sale" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Sale" ALTER COLUMN "status" SET DEFAULT 'COMPLETED';
COMMIT;

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "customLength" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "allowCustomLength" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageUrls" TEXT[];

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "customLength" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "SystemSettings" DROP COLUMN "deliveryChargeInsideDhaka",
DROP COLUMN "deliveryChargeOutsideDhaka",
ADD COLUMN     "requireOrderOtpVerify" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "charge" DECIMAL(10,2) NOT NULL DEFAULT 60.00,
    "allowCashOnDelivery" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryZone_name_key" ON "DeliveryZone"("name");
