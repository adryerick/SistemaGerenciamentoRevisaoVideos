import { toChangeRequestDto } from "../../../../lib/presenters";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/projetos/[id]/solicitacoes">,
) {
  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json();
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  const timestamp = typeof body.timestamp === "string" ? body.timestamp.trim() : "";
  const videoVersionId = Number(body.videoVersionId);

  if (!comment || !Number.isInteger(videoVersionId)) {
    return Response.json(
      { error: "Comentário e versão do vídeo são obrigatórios." },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, clientId: true },
  });
  const videoVersion = await prisma.videoVersion.findFirst({
    where: { id: videoVersionId, projectId },
    select: { id: true },
  });

  if (!project || !videoVersion) {
    return Response.json(
      { error: "Projeto ou versão não encontrados." },
      { status: 404 },
    );
  }

  const changeRequest = await prisma.changeRequest.create({
    data: {
      comment,
      timestamp: timestamp || null,
      projectId,
      videoVersionId,
      clientId: project.clientId,
    },
  });

  return Response.json(toChangeRequestDto(changeRequest), { status: 201 });
}
