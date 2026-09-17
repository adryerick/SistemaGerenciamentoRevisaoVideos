import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../app/lib/prisma";
import { processNextVideoJob, workerIsOnline } from "../app/lib/video-jobs";
import { backupData, lastBackupTime } from "../app/lib/data-backup";

const owner = randomUUID();
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { stopping = true; });
async function main() {
  async function acquire() { return prisma.$transaction(async (tx) => {
    const state = await tx.workerState.findUnique({ where: { id: "video-worker" } });
    if (workerIsOnline(state?.heartbeat)) return false;
    await tx.workerState.upsert({ where: { id: "video-worker" }, create: { id: "video-worker", owner, heartbeat: new Date() }, update: { owner, heartbeat: new Date() } });
    await tx.videoJob.updateMany({ where: { status: "Preparando" }, data: { status: "Na fila", owner: null, error: null } });
    return true;
  }); }
  let acquired = await acquire();
  for (let attempt = 0; !acquired && !stopping && attempt < 7; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    acquired = await acquire();
  }
  if (!acquired) { console.log("Já existe um processador ativo para este banco."); return; }
  console.log("Processador de vídeo ativo; fila persistente e uma conversão por vez.");
  let updating = false;
  const heartbeat = setInterval(async () => {
    if (updating) return;
    updating = true;
    try {
      const result = await prisma.workerState.updateMany({ where: { id: "video-worker", owner }, data: { heartbeat: new Date() } });
      if (!result.count) stopping = true;
    } catch (error) { console.error("Falha no heartbeat:", error); stopping = true; }
    finally { updating = false; }
  }, 5000);
  let backupAttempt = 0;
  try {
    while (!stopping) {
      const worked = await processNextVideoJob(owner);
      if (!worked && process.env.VIDEOREVIEW_BACKUP_DISABLED !== "1" && Date.now() - backupAttempt > 3600000) {
        backupAttempt = Date.now();
        const lastBackup = await lastBackupTime();
        if (Date.now() - lastBackup >= 24 * 3600000) {
          try {
            const target = await backupData();
            await prisma.workerState.updateMany({ where: { id: "video-worker", owner }, data: { lastBackupAt: new Date(), backupError: null } });
            console.log(`Backup automático concluído: ${target}`);
          } catch (error) {
            console.error("Backup automático incompleto:", error);
            await prisma.workerState.updateMany({ where: { id: "video-worker", owner }, data: { backupError: "Backup incompleto. Execute npm run backup e confira o espaço em disco; evite excluir arquivos durante a cópia." } });
          }
        } else {
          await prisma.workerState.updateMany({ where: { id: "video-worker", owner }, data: { lastBackupAt: new Date(lastBackup), backupError: null } });
        }
      }
      await new Promise((resolve) => setTimeout(resolve, worked ? 100 : 1000));
    }
  } finally {
    clearInterval(heartbeat);
    await prisma.workerState.updateMany({ where: { id: "video-worker", owner }, data: { heartbeat: new Date(0) } });
  }
}
main().catch((error) => { console.error("Processador interrompido:", error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
