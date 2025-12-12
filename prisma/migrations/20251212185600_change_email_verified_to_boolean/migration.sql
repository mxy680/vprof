-- AlterTable
ALTER TABLE "user" DROP COLUMN "emailVerified";

-- AlterTable
ALTER TABLE "user" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;

