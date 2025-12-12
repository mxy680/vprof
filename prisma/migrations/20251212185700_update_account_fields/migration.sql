-- Add Better Auth fields
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "providerId" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accessToken" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "idToken" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshToken" TEXT;

-- Set default type for existing records
UPDATE "account" SET "type" = 'oauth' WHERE "type" IS NULL OR "type" = '';
ALTER TABLE "account" ALTER COLUMN "type" SET DEFAULT 'oauth';
ALTER TABLE "account" ALTER COLUMN "type" SET NOT NULL;
