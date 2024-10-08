/*
  Warnings:

  - Added the required column `boughtAtPrice` to the `Purchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isTradable` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "boughtAtPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "isTradable" BOOLEAN NOT NULL;
