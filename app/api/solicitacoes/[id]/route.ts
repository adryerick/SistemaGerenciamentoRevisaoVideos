import { getDemoEditor } from "../../../lib/demo-editor";
import { toChangeRequestDto } from "../../../lib/presenters";
import { prisma } from "../../../lib/prisma";

const statuses = ["Pendente", "Em andamento", "Resolvido"];

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/solicitacoes/[id]">,
) {
  const { id } = await params;
  const { status } = await request.json();

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

export async function DELETE(
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
