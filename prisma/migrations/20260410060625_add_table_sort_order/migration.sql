-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Table_storeId_sortOrder_idx" ON "Table"("storeId", "sortOrder");
