-- CreateEnum
CREATE TYPE "ExpenseChannel" AS ENUM ('POS', 'ECOMMERCE', 'BOTH');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "channel" "ExpenseChannel" NOT NULL DEFAULT 'BOTH';
