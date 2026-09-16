import { toChangeRequestDto } from "../../../../lib/presenters";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/revisao/[token]/solicitacoes">,
) {
  const { token } = await params;
  const body = await request.json();
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  const timestamp = typeof body.timestamp === "string" ? body.timestamp.trim() : "";
  const videoVersionId = Number(body.videoVersionId);

  if (!comment || comment.length > 2000 || !Number.isInteger(videoVersionId)) {
    return Response.json(
      { error: "Comentário e versão do vídeo são obrigatórios." },
      { status: 400 },
    );
  }

  const project = await prisma.project.findFirst({
    where: { reviewToken: token, reviewEnabled: true },
    select: { id: true, clientId: true },
  });

  if (!project) {
    return Response.json({ error: "Este link de revisão não está disponível." }, { status: 404 });
  }

  const videoVersion = await prisma.videoVersion.findFirst({
    where: { id: videoVersionId, projectId: project.id },
    select: { id: true },
  });

  if (!videoVersion) {
    return Response.json({ error: "Versão de vídeo não encontrada." }, { status: 404 });
  }

  const changeRequest = await prisma.changeRequest.create({
    data: {
      comment,
      timestamp: timestamp || null,
      projectId: project.id,
      videoVersionId,
      clientId: project.clientId,
    },
  });

  return Response.json(toChangeRequestDto(changeRequest), { status: 201 });
}
