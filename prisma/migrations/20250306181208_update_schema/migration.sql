/*
  Warnings:

  - You are about to drop the `RoomAmenity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RoomAmenities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `hotelId` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Room` table. All the data in the column will be lost.
  - Added the required column `number` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomTypeId` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "RoomAmenity_name_key";

-- DropIndex
DROP INDEX "_RoomAmenities_B_index";

-- DropIndex
DROP INDEX "_RoomAmenities_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RoomAmenity";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RoomImage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_RoomAmenities";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hotelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerNight" REAL NOT NULL,
    CONSTRAINT "RoomType_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomTypeId" TEXT NOT NULL,
    "amenity" TEXT NOT NULL,
    CONSTRAINT "amenities_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomTypeImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomTypeId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    CONSTRAINT "RoomTypeImage_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomTypeId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Room" ("id") SELECT "id" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
