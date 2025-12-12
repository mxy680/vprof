-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "filename" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "transcript" TEXT,
    "segments" JSONB,
    "voiceSample" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Video_status_idx" ON "Video"("status");

-- CreateIndex
CREATE INDEX "Video_createdAt_idx" ON "Video"("createdAt");
