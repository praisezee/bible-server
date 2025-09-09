/*
  Warnings:

  - A unique constraint covering the columns `[bookId,number]` on the table `Chapter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chapterId,number]` on the table `Verse` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Chapter_bookId_number_key" ON "public"."Chapter"("bookId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Verse_chapterId_number_key" ON "public"."Verse"("chapterId", "number");
