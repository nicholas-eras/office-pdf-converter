/*
  Warnings:

  - A unique constraint covering the columns `[fileId]` on the table `UserFile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserFile_userId_fileId_key";

-- CreateIndex
CREATE UNIQUE INDEX "UserFile_fileId_key" ON "UserFile"("fileId");
