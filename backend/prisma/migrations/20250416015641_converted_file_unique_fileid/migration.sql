/*
  Warnings:

  - A unique constraint covering the columns `[fileId]` on the table `ConvertedFile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ConvertedFile_fileId_key" ON "ConvertedFile"("fileId");
