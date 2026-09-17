ALTER TABLE "ChangeRequest" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'Normal';
CREATE TABLE "VideoJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" INTEGER NOT NULL,
  "fileName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Na fila',
  "error" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "versionId" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "VideoJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "VideoJob_status_createdAt_idx" ON "VideoJob"("status", "createdAt");
CREATE INDEX "VideoJob_projectId_idx" ON "VideoJob"("projectId");
CREATE TABLE "WorkerState" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "owner" TEXT NOT NULL,
  "heartbeat" DATETIME NOT NULL,
  "lastBackupAt" DATETIME,
  "backupError" TEXT
);
