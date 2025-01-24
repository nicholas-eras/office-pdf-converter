/*
  Warnings:

  - A unique constraint covering the columns `[fileName]` on the table `ConvertedFile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ConvertedFile_fileName_key" ON "ConvertedFile"("fileName");
