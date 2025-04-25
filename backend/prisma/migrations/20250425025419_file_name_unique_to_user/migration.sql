/*
  Warnings:

  - A unique constraint covering the columns `[fileName,userId]` on the table `ConvertedFile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fileName,userId]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "File_fileName_key";

-- CreateIndex
CREATE UNIQUE INDEX "ConvertedFile_fileName_userId_key" ON "ConvertedFile"("fileName", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "File_fileName_userId_key" ON "File"("fileName", "userId");
