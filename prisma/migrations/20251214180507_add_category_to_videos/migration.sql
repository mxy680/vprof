-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "category" TEXT;

-- CreateIndex
CREATE INDEX "Video_category_idx" ON "Video"("category");
