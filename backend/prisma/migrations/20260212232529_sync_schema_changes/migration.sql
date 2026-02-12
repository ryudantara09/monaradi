/*
  Warnings:

  - You are about to drop the `ContractParty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContractTerrain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OwnershipHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransactionDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransactionParty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransactionTerrain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `endDate` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `legalRegNumber` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `ImageProcessingQueue` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Parcel` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Parcel` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Terrain` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Terrain` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ContractParty";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ContractTerrain";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OwnershipHistory";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Project";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Transaction";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TransactionDocument";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TransactionParty";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TransactionTerrain";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ParcelDocument" (
    "parcelId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    PRIMARY KEY ("parcelId", "documentId"),
    CONSTRAINT "ParcelDocument_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ParcelDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractNumber" TEXT,
    "terms" TEXT,
    "notes" TEXT,
    "saleAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT NOT NULL,
    CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("contractNumber", "createdAt", "id", "notes", "saleAmount", "terms", "updatedAt") SELECT "contractNumber", "createdAt", "id", "notes", "saleAmount", "terms", "updatedAt" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "idNumber" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("address", "createdAt", "email", "id", "idNumber", "name", "notes", "phone", "updatedAt") SELECT "address", "createdAt", "email", "id", "idNumber", "name", "notes", "phone", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE TABLE "new_ImageProcessingQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "terrainId" TEXT,
    "imageData" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resultData" TEXT,
    "webhookUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);
INSERT INTO "new_ImageProcessingQueue" ("createdAt", "id", "imageData", "processedAt", "resultData", "status", "webhookUrl") SELECT "createdAt", "id", "imageData", "processedAt", "resultData", "status", "webhookUrl" FROM "ImageProcessingQueue";
DROP TABLE "ImageProcessingQueue";
ALTER TABLE "new_ImageProcessingQueue" RENAME TO "ImageProcessingQueue";
CREATE TABLE "new_Parcel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "geometry" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ownerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "areaSqm" REAL NOT NULL,
    "pricePerSqm" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "terrainId" TEXT,
    "customerId" TEXT,
    "contractId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Parcel_terrainId_fkey" FOREIGN KEY ("terrainId") REFERENCES "Terrain" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Parcel_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Parcel_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Parcel" ("areaSqm", "createdAt", "customerId", "geometry", "id", "label", "ownerName", "pricePerSqm", "status", "terrainId", "totalPrice", "updatedAt") SELECT "areaSqm", "createdAt", "customerId", "geometry", "id", "label", "ownerName", "pricePerSqm", "status", "terrainId", "totalPrice", "updatedAt" FROM "Parcel";
DROP TABLE "Parcel";
ALTER TABLE "new_Parcel" RENAME TO "Parcel";
CREATE TABLE "new_Terrain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "mapReference" TEXT,
    "imagePath" TEXT,
    "imageData" BLOB,
    "scaleFactor" REAL,
    "refLineData" TEXT,
    "areaSize" REAL,
    "areaUnit" TEXT NOT NULL DEFAULT 'sqm',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Terrain" ("address", "areaSize", "areaUnit", "createdAt", "id", "latitude", "longitude", "mapReference", "name", "notes", "updatedAt") SELECT "address", "areaSize", "areaUnit", "createdAt", "id", "latitude", "longitude", "mapReference", "name", "notes", "updatedAt" FROM "Terrain";
DROP TABLE "Terrain";
ALTER TABLE "new_Terrain" RENAME TO "Terrain";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
