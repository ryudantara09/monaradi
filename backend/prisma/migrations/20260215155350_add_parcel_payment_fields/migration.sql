-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Parcel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "geometry" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ownerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "areaSqm" REAL NOT NULL,
    "pricePerSqm" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "terrainId" TEXT,
    "customerId" TEXT,
    "contractId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Parcel_terrainId_fkey" FOREIGN KEY ("terrainId") REFERENCES "Terrain" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Parcel_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Parcel_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Parcel" ("areaSqm", "contractId", "createdAt", "customerId", "geometry", "id", "label", "ownerName", "pricePerSqm", "status", "terrainId", "totalPrice", "updatedAt") SELECT "areaSqm", "contractId", "createdAt", "customerId", "geometry", "id", "label", "ownerName", "pricePerSqm", "status", "terrainId", "totalPrice", "updatedAt" FROM "Parcel";
DROP TABLE "Parcel";
ALTER TABLE "new_Parcel" RENAME TO "Parcel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
