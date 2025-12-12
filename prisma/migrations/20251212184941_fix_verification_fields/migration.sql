/*
  Warnings:

  - You are about to drop the column `expires` on the `verification` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "verification" DROP COLUMN "expires",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
