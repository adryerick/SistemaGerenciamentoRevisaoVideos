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

  try {
    const changeRequest = await prisma.changeRequest.update({
      where: { id: Number(id) },
      data: { status },
    });

    return Response.json(toChangeRequestDto(changeRequest));
  } catch {
    return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }
}
