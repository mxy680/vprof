-- AlterTable
ALTER TABLE "account" ADD COLUMN "accountId" TEXT;

-- Populate accountId from providerAccountId for existing records
UPDATE "account" SET "accountId" = "providerAccountId" WHERE "accountId" IS NULL;

-- Make accountId NOT NULL
ALTER TABLE "account" ALTER COLUMN "accountId" SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX "account_provider_accountId_key" ON "account"("provider", "accountId");

