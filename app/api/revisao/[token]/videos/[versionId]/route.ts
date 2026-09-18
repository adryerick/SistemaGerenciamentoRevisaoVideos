import { prisma } from "../../../../../lib/prisma";
import { videoResponse } from "../../../../../lib/video-response";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/revisao/[token]/videos/[versionId]">,
) {
  const { token, versionId } = await params;
  const videoVersionId = Number(versionId);

  if (!Number.isSafeInteger(videoVersionId) || videoVersionId <= 0) {
    return new Response("Vídeo não encontrado.", { status: 404 });
  }

  const project = await prisma.project.findFirst({
    where: { reviewToken: token, reviewEnabled: true },
    select: { id: true },
  });

  if (!project) {
    return new Response("Link de revisão indisponível.", { status: 404 });
  }

  const videoVersion = await prisma.videoVersion.findFirst({
    where: { id: videoVersionId, projectId: project.id },
    select: { projectId: true, storagePath: true, mimeType: true },
  });

  if (!videoVersion) {
    return new Response("Vídeo não encontrado.", { status: 404 });
  }

  return videoResponse(request, videoVersion);
}
