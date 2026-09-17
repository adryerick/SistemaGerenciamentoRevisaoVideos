import { getAuthenticatedEditor, withEditor } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/prisma";
import { videoThumbnail } from "../../../../../../lib/video-thumbnail";

export const runtime = "nodejs";
async function get(_request: Request, { params }: RouteContext<"/api/projetos/[id]/versoes/[versionId]/miniatura">) {
  const { id, versionId } = await params;
  const projectId = Number(id);
  const videoVersionId = Number(versionId);
  if (!Number.isSafeInteger(projectId) || projectId <= 0 || !Number.isSafeInteger(videoVersionId) || videoVersionId <= 0) return new Response(null, { status: 404 });
  const editor = await getAuthenticatedEditor();
  if (!editor) return new Response(null, { status: 401 });
  const version = await prisma.videoVersion.findFirst({ where: { id: videoVersionId, projectId, project: { editorId: editor.id } }, select: { storagePath: true } });
  if (!version?.storagePath) return new Response(null, { status: 404 });
  try {
    const image = await videoThumbnail(projectId, version.storagePath);
    return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/jpeg", "Content-Length": String(image.length), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}
export const GET = withEditor(get);
