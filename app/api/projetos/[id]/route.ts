import { getDemoEditor } from "../../../lib/demo-editor";
import { prisma } from "../../../lib/prisma";

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/projetos/[id]">,
) {
  const { id } = await params;
  const projectId = Number(id);
  const { reviewEnabled } = await request.json();

  if (!Number.isInteger(projectId) || typeof reviewEnabled !== "boolean") {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

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
    data: { reviewEnabled },
    select: { reviewEnabled: true },
  });

  return Response.json(updatedProject);
}

export async function DELETE(
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

  await prisma.project.delete({ where: { id: project.id } });
  return Response.json({ success: true });
}
