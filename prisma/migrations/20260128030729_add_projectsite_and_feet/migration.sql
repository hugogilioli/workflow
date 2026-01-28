-- DropIndex
DROP INDEX "Material_name_idx";

-- DropIndex
DROP INDEX "MaterialRequestItem_requestId_itemNumber_key";

-- DropIndex
DROP INDEX "MaterialRequestItem_materialId_idx";

-- CreateTable
CREATE TABLE "ProjectSite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "lastFiberFt" REAL,
    "lastStrandFt" REAL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MaterialRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestCode" TEXT NOT NULL,
    "projectSite" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fiberFt" REAL,
    "strandFt" REAL,
    "userId" TEXT,
    "projectSiteRefId" TEXT,
    "teamId" TEXT,
    CONSTRAINT "MaterialRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialRequest_projectSiteRefId_fkey" FOREIGN KEY ("projectSiteRefId") REFERENCES "ProjectSite" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MaterialRequest" ("createdAt", "date", "id", "projectSite", "requestCode", "requestedBy", "teamId", "userId") SELECT "createdAt", "date", "id", "projectSite", "requestCode", "requestedBy", "teamId", "userId" FROM "MaterialRequest";
DROP TABLE "MaterialRequest";
ALTER TABLE "new_MaterialRequest" RENAME TO "MaterialRequest";
CREATE UNIQUE INDEX "MaterialRequest_requestCode_key" ON "MaterialRequest"("requestCode");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OPERATOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "passwordHash", "role") SELECT "createdAt", "email", "id", "name", "passwordHash", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSite_name_key" ON "ProjectSite"("name");
