import { withEditor } from "../../../../lib/auth";
import { toChangeRequestDto } from "../../../../lib/presenters";
import { prisma } from "../../../../lib/prisma";
import { getDemoEditor } from "../../../../lib/demo-editor";
import { validateReviewInput } from "../../../../lib/review-feedback";

async function handlePOST(
  request: Request,
  { params }: RouteContext<"/api/projetos/[id]/solicitacoes">,
) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    return Response.json({ error: "Projeto inválido." }, { status: 400 });
  }
  const input = validateReviewInput(await request.json().catch(() => null));
  if ("error" in input) return Response.json(input, { status: 400 });
  const { comment, timestamp, videoVersionId } = input;
  const editor = await getDemoEditor();

  const project = await prisma.project.findFirst({
    where: { id: projectId, editorId: editor.id },
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

export const POST = withEditor(handlePOST);
