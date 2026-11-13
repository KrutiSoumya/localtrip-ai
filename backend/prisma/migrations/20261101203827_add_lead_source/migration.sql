-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "source" TEXT;

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE INDEX "Lead_userId_source_idx" ON "Lead"("userId", "source");
