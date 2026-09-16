-- CreateTable
CREATE TABLE "VideoVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER NOT NULL,
    CONSTRAINT "VideoVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangeRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comment" TEXT NOT NULL,
    "timestamp" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER NOT NULL,
    "videoVersionId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    CONSTRAINT "ChangeRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChangeRequest_videoVersionId_fkey" FOREIGN KEY ("videoVersionId") REFERENCES "VideoVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChangeRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VideoVersion_projectId_idx" ON "VideoVersion"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoVersion_projectId_number_key" ON "VideoVersion"("projectId", "number");

-- CreateIndex
CREATE INDEX "ChangeRequest_projectId_idx" ON "ChangeRequest"("projectId");

-- CreateIndex
CREATE INDEX "ChangeRequest_videoVersionId_idx" ON "ChangeRequest"("videoVersionId");

-- CreateIndex
CREATE INDEX "ChangeRequest_clientId_idx" ON "ChangeRequest"("clientId");
