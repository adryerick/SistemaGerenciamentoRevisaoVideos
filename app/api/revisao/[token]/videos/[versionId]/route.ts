import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

function parseRange(range: string | null, fileSize: number) {
  if (!range) {
    return { start: 0, end: fileSize - 1, partial: false };
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    return null;
  }

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Math.min(Number(match[2]), fileSize - 1) : fileSize - 1;

  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || start >= fileSize) {
    return null;
  }

  return { start, end, partial: true };
}

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/revisao/[token]/videos/[versionId]">,
) {
  const { token, versionId } = await params;
  const videoVersionId = Number(versionId);

  if (!Number.isInteger(videoVersionId)) {
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
    select: { storagePath: true, mimeType: true },
  });

  if (!videoVersion?.storagePath?.startsWith("/uploads/projects/")) {
    return new Response("Vídeo não encontrado.", { status: 404 });
  }

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const filePath = path.resolve(process.cwd(), "public", `.${videoVersion.storagePath}`);
  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    return new Response("Vídeo não encontrado.", { status: 404 });
  }

  let fileInfo;
  try {
    fileInfo = await stat(filePath);
  } catch {
    return new Response("Vídeo não encontrado.", { status: 404 });
  }

  const range = parseRange(request.headers.get("range"), fileInfo.size);
  if (!range) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${fileInfo.size}` },
    });
  }

  const contentLength = range.end - range.start + 1;
  const stream = Readable.toWeb(
    createReadStream(filePath, { start: range.start, end: range.end }),
  ) as ReadableStream;

  return new Response(stream, {
    status: range.partial ? 206 : 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(contentLength),
      "Content-Type": videoVersion.mimeType || "video/mp4",
      ...(range.partial
        ? { "Content-Range": `bytes ${range.start}-${range.end}/${fileInfo.size}` }
        : {}),
    },
  });
}
