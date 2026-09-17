import { withEditor } from "../../../lib/auth";
import { getDemoEditor } from "../../../lib/demo-editor";
import { toChangeRequestDto } from "../../../lib/presenters";
import { prisma } from "../../../lib/prisma";

const statuses = ["Pendente", "Em andamento", "Resolvido"];

async function handlePATCH(
  request: Request,
  { params }: RouteContext<"/api/solicitacoes/[id]">,
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) return Response.json({ error: "Solicitação inválida." }, { status: 400 });

  if (!statuses.includes(status)) {
    return Response.json({ error: "Status inválido." }, { status: 400 });
  }

  const editor = await getDemoEditor();
  const requestId = Number(id);
  const existingRequest = await prisma.changeRequest.findFirst({
    where: { id: requestId, project: { editorId: editor.id } },
    select: { id: true },
  });

  if (!existingRequest) {
    return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }

  try {
    const changeRequest = await prisma.changeRequest.update({
      where: { id: existingRequest.id },
      data: { status },
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
