import { toChangeRequestDto } from "../../../../lib/presenters";
import { prisma } from "../../../../lib/prisma";
import { validateReviewInput } from "../../../../lib/review-feedback";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/revisao/[token]/solicitacoes">,
) {
  const { token } = await params;
  const input = validateReviewInput(await request.json().catch(() => null));
  if ("error" in input) return Response.json(input, { status: 400 });
  const { comment, timestamp, videoVersionId } = input;

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
