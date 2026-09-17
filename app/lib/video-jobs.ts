import path from "node:path";
import { mkdir, rm, stat, copyFile } from "node:fs/promises";
import { prisma } from "./prisma";
import { convertVideoForBrowser, VideoConversionError } from "./video-conversion";

export const dataDirectory = process.env.VIDEOREVIEW_DATA_DIR ?? path.join(process.cwd(), ".local");
export function jobDirectory(id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Identificador de processamento inválido.");
  const root = path.resolve(dataDirectory, "video-queue");
  const target = path.resolve(root, id);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Caminho inválido.");
  return target;
}
export function workerIsOnline(heartbeat: Date | null | undefined, now = Date.now()) {
  return !!heartbeat && now - heartbeat.getTime() >= 0 && now - heartbeat.getTime() < 30000;
}
export async function workerOnline() {
  return workerIsOnline((await prisma.workerState.findUnique({ where: { id: "video-worker" } }))?.heartbeat);
}
export async function removeJobFiles(id: string) {
  await rm(jobDirectory(id), { recursive: true, force: true });
}

/** One durable job at a time. The caller must own the worker lease. */
export async function processNextVideoJob(owner: string) {
  const job = await prisma.$transaction(async (tx) => {
    const lease = await tx.workerState.findUnique({ where: { id: "video-worker" } });
    if (lease?.owner !== owner || !workerIsOnline(lease.heartbeat)) return null;
    const next = await tx.videoJob.findFirst({ where: { status: "Na fila" }, orderBy: { createdAt: "asc" } });
    if (!next) return null;
    const claimed = await tx.videoJob.updateMany({ where: { id: next.id, status: "Na fila" }, data: { status: "Preparando", owner, error: null, attempts: { increment: 1 } } });
    return claimed.count ? next : null;
  });
  if (!job) return false;
  const directory = jobDirectory(job.id);
  const input = path.join(directory, "input");
  const output = path.join(directory, `${owner}.mp4`);
  const projectRoot = path.resolve(process.cwd(), "public/uploads/projects", String(job.projectId));
  const published = path.join(projectRoot, `${job.id}-${owner}.mp4`);
  let copied = false;
  let committed = false;
  try {
    await rm(output, { force: true });
    await convertVideoForBrowser(input, output);
    const size = (await stat(output)).size;
    await mkdir(projectRoot, { recursive: true });
    await copyFile(output, published); copied = true;
    await prisma.$transaction(async (tx) => {
      const existing = await tx.videoJob.findUnique({ where: { id: job.id } });
      const lease = await tx.workerState.findUnique({ where: { id: "video-worker" } });
      if (!existing || existing.status !== "Preparando" || existing.owner !== owner || lease?.owner !== owner || !workerIsOnline(lease.heartbeat)) throw new Error("Processamento cancelado.");
      const latest = await tx.videoVersion.findFirst({ where: { projectId: job.projectId }, orderBy: { number: "desc" }, select: { number: true } });
      const number = (latest?.number ?? 0) + 1;
      const version = await tx.videoVersion.create({ data: { projectId: job.projectId, number, fileName: job.fileName, storagePath: `/uploads/projects/${job.projectId}/${job.id}-${owner}.mp4`, mimeType: "video/mp4", fileSize: size } });
      await tx.project.update({ where: { id: job.projectId }, data: { currentVersion: String(number).padStart(2, "0"), status: "Em revisão" } });
      await tx.videoJob.update({ where: { id: job.id }, data: { status: "Pronto", versionId: version.id, error: null } });
    });
    committed = true;
    await removeJobFiles(job.id).catch(console.error);
  } catch (error) {
    if (copied && !committed) await rm(published, { force: true }).catch(console.error);
    await prisma.videoJob.updateMany({ where: { id: job.id, status: "Preparando", owner }, data: { status: "Falhou", error: error instanceof VideoConversionError ? error.message : "Não foi possível preparar o vídeo. Verifique o espaço em disco e tente novamente." } });
    await rm(output, { force: true }).catch(console.error);
  }
  return true;
}
