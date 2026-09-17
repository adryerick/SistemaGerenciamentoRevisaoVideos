import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

const run = promisify(execFile);
const pending = new Map<string, Promise<Buffer>>();
let active = 0;
const waiting: (() => void)[] = [];
async function withGenerationSlot<T>(generate: () => Promise<T>) {
  if (active < 2) active++;
  else await new Promise<void>((resolve) => waiting.push(resolve));
  try { return await generate(); }
  finally { const next = waiting.shift(); if (next) next(); else active--; }
}

export function thumbnailSource(projectId: number, storagePath: string | null) {
  if (!Number.isSafeInteger(projectId) || projectId <= 0 || !storagePath?.startsWith(`/uploads/projects/${projectId}/`)) return null;
  const root = path.resolve(process.cwd(), "public/uploads/projects", String(projectId));
  const source = path.resolve(process.cwd(), "public", `.${storagePath}`);
  return source.startsWith(`${root}${path.sep}`) ? source : null;
}

/** JPEG only: cards never download/play the full video. Derived cache stays private. */
export async function videoThumbnail(projectId: number, storagePath: string | null) {
  const source = thumbnailSource(projectId, storagePath);
  if (!source || !ffmpegPath) throw new Error("Prévia indisponível.");
  // Runtime uploads are external data, not server bundle dependencies.
  const info = await stat(/*turbopackIgnore: true*/ source);
  if (!info.isFile()) throw new Error("Vídeo não encontrado.");
  const key = createHash("sha256").update(`${source}:${info.size}:${info.mtimeMs}`).digest("hex");
  const cacheRoot = path.resolve(process.env.VIDEOREVIEW_DATA_DIR ?? path.join(process.cwd(), ".local"), "thumbnails");
  const target = path.join(cacheRoot, `${key}.jpg`);
  const cached = await readFile(target).catch(() => null);
  if (cached?.length) return cached;
  const existing = pending.get(key);
  if (existing) return existing;
  const generating = withGenerationSlot(async () => {
    let image: Buffer | undefined;
    // A short seek avoids the usual initial black frame. Very short clips fall
    // back to their first frame instead of leaving an empty thumbnail.
    for (const second of [1, 0]) {
      const result = await run(ffmpegPath!, ["-hide_banner", "-loglevel", "error", "-nostdin", "-protocol_whitelist", "file,pipe",
        "-threads", "1", "-ss", String(second), "-i", source, "-map", "0:v:0", "-an", "-sn", "-dn", "-frames:v", "1",
        "-vf", "scale=min(640\\,iw):-2", "-threads", "1", "-q:v", "4", "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"],
      { windowsHide: true, timeout: 20000, maxBuffer: 2 * 1024 * 1024, encoding: "buffer" });
      if (result.stdout.length) { image = result.stdout; break; }
    }
    if (!image?.length) throw new Error("Não foi possível gerar a prévia.");
    await mkdir(cacheRoot, { recursive: true, mode: 0o700 });
    const temporary = path.join(cacheRoot, `${key}-${randomUUID()}.tmp`);
    try { await writeFile(temporary, image, { mode: 0o600 }); await rename(temporary, target); }
    finally { await rm(temporary, { force: true }).catch(() => {}); }
    return image;
  });
  pending.set(key, generating);
  try { return await generating; } finally { pending.delete(key); }
}
