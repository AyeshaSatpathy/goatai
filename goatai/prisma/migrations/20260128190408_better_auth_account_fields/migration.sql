-- AlterTable
ALTER TABLE "Account" ADD COLUMN "accessTokenExpiresAt" DATETIME;
ALTER TABLE "Account" ADD COLUMN "idToken" TEXT;
ALTER TABLE "Account" ADD COLUMN "scope" TEXT;
