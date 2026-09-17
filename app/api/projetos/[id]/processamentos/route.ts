import { withEditor, requireEditor } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { removeJobFiles, workerOnline } from "../../../../lib/video-jobs";

async function get(_request: Request, { params }: RouteContext<"/api/projetos/[id]/processamentos">) {
  const { id } = await params;
  const editor = await requireEditor();
  const projectId = Number(id);
  if (!Number.isSafeInteger(projectId) || projectId <= 0) return Response.json({ error: "Projeto inválido." }, { status: 400 });
  if (!await prisma.project.findFirst({ where: { id: projectId, editorId: editor.id }, select: { id: true } })) return Response.json({ error: "Projeto não encontrado." }, { status: 404 });
  const jobs = await prisma.videoJob.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, fileName: true, status: true, error: true, versionId: true, attempts: true } });
  return Response.json({ jobs, online: await workerOnline() }, { headers: { "Cache-Control": "no-store" } });
}
async function retry(request: Request, { params }: RouteContext<"/api/projetos/[id]/processamentos">) {
  const { id } = await params;
  const editor = await requireEditor();
  const body = await request.json().catch(() => null);
  if (typeof body?.jobId !== "string" || !Number.isSafeInteger(Number(id))) return Response.json({ error: "Processamento inválido." }, { status: 400 });
  if (!await workerOnline()) return Response.json({ error: "O processador está offline." }, { status: 503 });
  return prisma.$transaction(async (tx) => {
    const job = await tx.videoJob.findFirst({ where: { id: body.jobId, projectId: Number(id), project: { editorId: editor.id } } });
    if (!job) return Response.json({ error: "Processamento não encontrado." }, { status: 404 });
    if (job.status !== "Falhou" || job.attempts >= 3) return Response.json({ error: "Só é possível repetir uma falha, até 3 tentativas. Reexporte o vídeo se o formato for inválido." }, { status: 409 });
    if (await tx.videoJob.count({ where: { status: { in: ["Na fila", "Preparando"] } } }) >= 3) return Response.json({ error: "Fila cheia. Aguarde um preparo terminar." }, { status: 429 });
    await tx.videoJob.update({ where: { id: job.id }, data: { status: "Na fila", error: null } });
    return Response.json({ status: "Na fila" });
  });
}
async function discard(request: Request, { params }: RouteContext<"/api/projetos/[id]/processamentos">) {
  const { id } = await params;
  const editor = await requireEditor();
  const body = await request.json().catch(() => null);
  if (typeof body?.jobId !== "string" || !Number.isSafeInteger(Number(id))) return Response.json({ error: "Processamento inválido." }, { status: 400 });
  const removed = await prisma.videoJob.deleteMany({ where: { id: body.jobId, projectId: Number(id), status: "Falhou", project: { editorId: editor.id } } });
  if (!removed.count) return Response.json({ error: "Falha não encontrada. Preparos em andamento não podem ser descartados." }, { status: 409 });
  await removeJobFiles(body.jobId);
  return Response.json({ status: "Descartado" });
}
export const GET = withEditor(get);
export const PATCH = withEditor(retry);
export const DELETE = withEditor(discard);
