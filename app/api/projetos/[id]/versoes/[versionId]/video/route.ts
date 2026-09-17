import { getAuthenticatedEditor, withEditor } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prisma";
import { videoResponse } from "../../../../../../lib/video-response";

export const runtime = "nodejs";

async function handleGET(request: Request, { params }: RouteContext<"/api/projetos/[id]/versoes/[versionId]/video">) {
  const { id, versionId } = await params;
  const projectId = Number(id);
  const videoVersionId = Number(versionId);
  if (!Number.isInteger(projectId) || !Number.isInteger(videoVersionId)) return new Response("Vídeo não encontrado.", { status: 404 });
  const editor = await getAuthenticatedEditor();
  if (!editor) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  const version = await prisma.videoVersion.findFirst({
    where: { id: videoVersionId, projectId, project: { editorId: editor.id } },
    select: { projectId: true, storagePath: true, mimeType: true },
  });
  if (!version) return new Response("Vídeo não encontrado.", { status: 404 });
  return videoResponse(request, version);
}

export const GET = withEditor(handleGET);
