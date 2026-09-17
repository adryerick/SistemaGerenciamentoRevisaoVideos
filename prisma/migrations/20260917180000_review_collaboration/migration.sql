ALTER TABLE "ChangeRequest" ADD COLUMN "authorName" TEXT;
CREATE TABLE "ReviewReply" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "comment" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "authorName" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "requestId" INTEGER NOT NULL,
  CONSTRAINT "ReviewReply_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ChangeRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ReviewReply_requestId_idx" ON "ReviewReply"("requestId");
CREATE TABLE "ReviewDecision" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "status" TEXT NOT NULL,
  "authorName" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "videoVersionId" INTEGER NOT NULL,
  CONSTRAINT "ReviewDecision_videoVersionId_fkey" FOREIGN KEY ("videoVersionId") REFERENCES "VideoVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ReviewDecision_videoVersionId_idx" ON "ReviewDecision"("videoVersionId");
