/*
  Warnings:

  - Added the required column `owner` to the `Competition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repo` to the `Competition` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Competition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "repo" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Competition" ("createdAt", "endDate", "id", "name", "startDate", "updatedAt") SELECT "createdAt", "endDate", "id", "name", "startDate", "updatedAt" FROM "Competition";
DROP TABLE "Competition";
ALTER TABLE "new_Competition" RENAME TO "Competition";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
