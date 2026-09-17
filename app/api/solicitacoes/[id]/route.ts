import { withEditor } from "../../../lib/auth";
import { getDemoEditor } from "../../../lib/demo-editor";
import { toChangeRequestDto } from "../../../lib/presenters";
import { prisma } from "../../../lib/prisma";
import { isPriority } from "../../../lib/request-priority";

const statuses = ["Pendente", "Em andamento", "Resolvido"];

async function handlePATCH(
  request: Request,
  { params }: RouteContext<"/api/solicitacoes/[id]">,
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  const priority = body?.priority;
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) return Response.json({ error: "Solicitação inválida." }, { status: 400 });

  if ((!statuses.includes(status) && !isPriority(priority)) || (status !== undefined && !statuses.includes(status)) || (priority !== undefined && !isPriority(priority))) {
    return Response.json({ error: "Status ou prioridade inválidos." }, { status: 400 });
  }

  const editor = await getDemoEditor();
  const requestId = Number(id);
  const existingRequest = await prisma.changeRequest.findFirst({
    where: { id: requestId, project: { editorId: editor.id } },
    select: { id: true, videoVersionId: true },
  });

  if (!existingRequest) {
    return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }

  try {
    const changeRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.changeRequest.update({ where: { id: existingRequest.id }, data: { ...(status !== undefined ? { status } : {}), ...(isPriority(priority) ? { priority } : {}) } });
      if (status !== undefined && status !== "Resolvido") await tx.reviewDecision.create({ data: { videoVersionId: existingRequest.videoVersionId, status: "Ajustes solicitados", authorName: editor.name } });
      return updated;
    });
    return Response.json(toChangeRequestDto(changeRequest));
  } catch {
    return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }
}

async function handleDELETE(
  _request: Request,
  { params }: RouteContext<"/api/solicitacoes/[id]">,
) {
  const { id } = await params;
  const requestId = Number(id);

  if (!Number.isInteger(requestId)) {
    return Response.json({ error: "Solicitação inválida." }, { status: 400 });
  }

  const editor = await getDemoEditor();
  const changeRequest = await prisma.changeRequest.findFirst({
    where: { id: requestId, project: { editorId: editor.id } },
    select: { id: true },
  });

  if (!changeRequest) {
    return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }

  await prisma.changeRequest.delete({ where: { id: changeRequest.id } });
  return Response.json({ success: true });
}

export const PATCH = withEditor(handlePATCH);
export const DELETE = withEditor(handleDELETE);
