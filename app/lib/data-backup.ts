import Database from "better-sqlite3";
import { copyFile, mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dataDirectory, jobDirectory } from "./video-jobs";

/** SQLite's backup API creates a consistent DB snapshot, including WAL writes. */
export async function backupData() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (!url.startsWith("file:")) throw new Error("Backup local disponível somente para SQLite.");
  const source = path.resolve(url.slice(5));
  const target = path.resolve(dataDirectory, "backups", `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`);
  await mkdir(target, { recursive: true, mode: 0o700 });
  const database = new Database(source, { readonly: true, fileMustExist: true });
  try { await database.backup(path.join(target, "dev.db")); }
  finally { database.close(); }
  const snapshot = new Database(path.join(target, "dev.db"), { readonly: true, fileMustExist: true });
  let files = 0;
  try {
    const uploads = path.resolve(process.cwd(), "public/uploads");
    for (const row of snapshot.prepare('SELECT "storagePath" FROM "VideoVersion" WHERE "storagePath" IS NOT NULL').all() as { storagePath: string }[]) {
      const relative = row.storagePath.replace(/^\/uploads\//, "");
      const original = path.resolve(uploads, relative);
      if (!original.startsWith(`${uploads}${path.sep}`) || !row.storagePath.startsWith("/uploads/")) throw new Error("Arquivo de vídeo fora da pasta de uploads.");
      const destination = path.join(target, "uploads", relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(original, destination); files++;
    }
    // Only auth artifacts, never the whole .local directory (contains backups).
    const auth = process.env.VIDEOREVIEW_AUTH_DIR ?? path.join(process.cwd(), ".local");
    await mkdir(path.join(target, "auth"), { mode: 0o700 });
    for (const name of ["auth.json", "setup-token", "recovery.json"]) {
      const original = path.join(auth, name);
      if (await stat(original).then(() => true, () => false)) {
        await copyFile(original, path.join(target, "auth", name)); files++;
      }
    }
    for (const job of snapshot.prepare('SELECT "id" FROM "VideoJob" WHERE "status" != \'Pronto\'').all() as { id: string }[]) {
      const destination = path.join(target, "video-queue", job.id);
      await mkdir(destination, { recursive: true });
      await copyFile(path.join(jobDirectory(job.id), "input"), path.join(destination, "input")); files++;
    }
    await writeFile(path.join(target, "manifest.json"), JSON.stringify({ complete: true, createdAt: new Date().toISOString(), files, format: 1 }, null, 2), { mode: 0o600 });
    await writeFile(path.join(dataDirectory, "last-backup.json"), JSON.stringify({ path: target, createdAt: new Date().toISOString() }), { mode: 0o600 });
    return target;
  } catch (error) {
    await writeFile(path.join(target, "manifest.json"), JSON.stringify({ complete: false, error: "Um arquivo não pôde ser copiado. Não use esta cópia como restauração completa." }), { mode: 0o600 });
    throw error;
  } finally { snapshot.close(); }
}
export async function lastBackupTime() {
  const record = await readFile(path.join(dataDirectory, "last-backup.json"), "utf8").then((content) => { try { return JSON.parse(content); } catch { return null; } }, () => null);
  const time = record ? Date.parse(record.createdAt) : NaN;
  return Number.isFinite(time) ? time : 0;
}
