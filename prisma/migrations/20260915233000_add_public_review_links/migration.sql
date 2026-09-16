-- Add a private, high-entropy token to each existing project before
-- enforcing its unique index. New projects receive a token via Prisma.
ALTER TABLE "Project" ADD COLUMN "reviewToken" TEXT;
ALTER TABLE "Project" ADD COLUMN "reviewEnabled" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Project"
SET "reviewToken" = lower(hex(randomblob(16)))
WHERE "reviewToken" IS NULL;

CREATE UNIQUE INDEX "Project_reviewToken_key" ON "Project"("reviewToken");
