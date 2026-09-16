-- Redefine the SQLite table to require a token on every project.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "currentVersion" TEXT NOT NULL DEFAULT '01',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "reviewToken" TEXT NOT NULL,
    "reviewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editorId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    CONSTRAINT "Project_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "Editor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Project" ("clientId", "createdAt", "currentVersion", "description", "editorId", "id", "name", "progress", "reviewEnabled", "reviewToken", "status")
SELECT "clientId", "createdAt", "currentVersion", "description", "editorId", "id", "name", "progress", "reviewEnabled", "reviewToken", "status" FROM "Project";

DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_reviewToken_key" ON "Project"("reviewToken");
CREATE INDEX "Project_editorId_idx" ON "Project"("editorId");
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
