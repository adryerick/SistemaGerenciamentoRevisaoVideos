import { toChangeRequestDto } from "../../../../lib/presenters";
import { prisma } from "../../../../lib/prisma";
import { validateReviewInput } from "../../../../lib/review-feedback";
import { validateReviewerName } from "../../../../lib/review-collaboration";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/revisao/[token]/solicitacoes">,
) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const name = validateReviewerName(body?.authorName);
  if ("error" in name) return Response.json(name, { status: 400 });
  const input = validateReviewInput(body);
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

  const changeRequest = await prisma.$transaction(async (tx) => {
    const created = await tx.changeRequest.create({
    data: {
      comment,
      authorName: name.name,
      timestamp: timestamp || null,
      projectId: project.id,
      videoVersionId,
      clientId: project.clientId,
    },
    });
    await tx.reviewDecision.create({ data: { videoVersionId, status: "Ajustes solicitados", authorName: name.name } });
    return created;
  });

  return Response.json(toChangeRequestDto(changeRequest), { status: 201 });
}
