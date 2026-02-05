-- CreateEnum
CREATE TYPE "MarketCategory" AS ENUM ('SPORTS', 'ACADEMICS', 'CAMPUS_LIFE', 'ENTERTAINMENT', 'POLITICS', 'WEATHER', 'OTHER');

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "category" "MarketCategory";

-- CreateIndex
CREATE INDEX "Market_category_idx" ON "Market"("category");
