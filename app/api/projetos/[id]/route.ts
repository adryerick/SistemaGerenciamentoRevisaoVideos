import { withEditor } from "../../../lib/auth";
import { rm } from "node:fs/promises";
import path from "node:path";
import { getDemoEditor } from "../../../lib/demo-editor";
import { prisma } from "../../../lib/prisma";
import { removeJobFiles } from "../../../lib/video-jobs";

export const runtime = "nodejs";

async function handlePATCH(
  request: Request,
  { params }: RouteContext<"/api/projetos/[id]">,
) {
  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json().catch(() => null);
  if (!Number.isSafeInteger(projectId) || projectId <= 0 || !body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const data: { reviewEnabled?: boolean; name?: string; description?: string; status?: string } = {};
  if ("reviewEnabled" in body) {
    if (typeof body.reviewEnabled !== "boolean") return Response.json({ error: "Link inválido." }, { status: 400 });
    data.reviewEnabled = body.reviewEnabled;
  }
  if ("name" in body) {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120) return Response.json({ error: "Informe um nome de até 120 caracteres." }, { status: 400 });
    data.name = body.name.trim();
  }
  if ("description" in body) {
    if (typeof body.description !== "string" || body.description.length > 2000) return Response.json({ error: "Descrição limitada a 2.000 caracteres." }, { status: 400 });
    data.description = body.description.trim();
  }
  if ("status" in body) {
    if (!["Pendente", "Em revisão", "Aguardando cliente", "Resolvido"].includes(body.status)) return Response.json({ error: "Status inválido." }, { status: 400 });
    data.status = body.status;
  }
  if (!Object.keys(data).length) return Response.json({ error: "Nenhuma alteração informada." }, { status: 400 });

  const editor = await getDemoEditor();
  const project = await prisma.project.findFirst({
    where: { id: projectId, editorId: editor.id },
    select: { id: true },
  });

  if (!project) {
    return Response.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data,
    select: { reviewEnabled: true, name: true, description: true, status: true },
  });

  return Response.json(updatedProject);
}

async function handleDELETE(
  _request: Request,
  { params }: RouteContext<"/api/projetos/[id]">,
) {
  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId)) {
    return Response.json({ error: "Projeto inválido." }, { status: 400 });
  }

  const editor = await getDemoEditor();
  const project = await prisma.project.findFirst({
    where: { id: projectId, editorId: editor.id },
    select: { id: true },
  });

  if (!project) {
    return Response.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const jobs = await prisma.videoJob.findMany({ where: { projectId: project.id }, select: { id: true } });
  await prisma.project.delete({ where: { id: project.id } });
  await Promise.all(jobs.map((job) => removeJobFiles(job.id).catch(console.error)));

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads", "projects");
  const projectUploads = path.resolve(uploadsRoot, String(project.id));
  if (projectUploads.startsWith(`${uploadsRoot}${path.sep}`)) {
    try {
      await rm(projectUploads, { recursive: true, force: true });
    } catch {
      // The database deletion remains valid even if local file cleanup is unavailable.
    }
  }

  return Response.json({ success: true });
}

export const PATCH = withEditor(handlePATCH);
export const DELETE = withEditor(handleDELETE);
