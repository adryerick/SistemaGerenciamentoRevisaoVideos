import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { parseVideoRange } from "./video-range";

/** Serve newly uploaded files dynamically, with identical range behavior for both roles. */
export async function videoResponse(request: Request, video: { projectId: number; storagePath: string | null; mimeType: string | null }) {
  const root = path.resolve(process.cwd(), "public", "uploads", "projects", String(video.projectId));
  if (!video.storagePath?.startsWith(`/uploads/projects/${video.projectId}/`)) return new Response("Vídeo não encontrado.", { status: 404 });
  const filePath = path.resolve(process.cwd(), "public", `.${video.storagePath}`);
  if (!filePath.startsWith(`${root}${path.sep}`)) return new Response("Vídeo não encontrado.", { status: 404 });
  let info;
  try { info = await stat(filePath); } catch { return new Response("Vídeo não encontrado.", { status: 404 }); }
  if (!info.isFile()) return new Response("Vídeo não encontrado.", { status: 404 });
  const range = parseVideoRange(request.headers.get("range"), info.size);
  if (!range) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
  const stream = Readable.toWeb(createReadStream(filePath, { start: range.start, end: range.end })) as ReadableStream;
  return new Response(stream, {
    status: range.partial ? 206 : 200,
    headers: {
      "Accept-Ranges": "bytes", "Content-Length": String(range.end - range.start + 1),
      "Content-Type": video.mimeType || "video/mp4", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      ...(range.partial ? { "Content-Range": `bytes ${range.start}-${range.end}/${info.size}` } : {}),
    },
  });
}
