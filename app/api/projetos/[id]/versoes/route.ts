import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { toVideoVersionDto } from "../../../../lib/presenters";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const MAX_VIDEO_SIZE = 250 * 1024 * 1024;
const supportedExtensions = new Set(["mp4", "mov", "webm", "m4v"]);
const mimeTypes: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  m4v: "video/x-m4v",
};

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/projetos/[id]/versoes">,
) {
  const { id } = await params;
  const projectId = Number(id);
  const formData = await request.formData();
  const video = formData.get("video");

  if (!Number.isInteger(projectId)) {
    return Response.json({ error: "Projeto inválido." }, { status: 400 });
  }

  if (!(video instanceof File) || video.size === 0) {
    return Response.json({ error: "Selecione um arquivo de vídeo." }, { status: 400 });
  }

  if (video.size > MAX_VIDEO_SIZE) {
    return Response.json(
      { error: "O vídeo deve ter no máximo 250 MB para os testes locais." },
      { status: 400 },
    );
  }

  const fileExtension = video.name.split(".").pop()?.toLowerCase() ?? "";
  if (!supportedExtensions.has(fileExtension)) {
    return Response.json(
      { error: "Envie um vídeo nos formatos MP4, MOV, WebM ou M4V." },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { videoVersions: { select: { number: true } } },
  });

  if (!project) {
    return Response.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const nextNumber = Math.max(0, ...project.videoVersions.map((version) => version.number)) + 1;
  const directory = path.join(process.cwd(), "public", "uploads", "projects", String(projectId));
  const storedFileName = `${randomUUID()}.${fileExtension}`;
  const filePath = path.join(directory, storedFileName);
  const storagePath = `/uploads/projects/${projectId}/${storedFileName}`;

  await mkdir(directory, { recursive: true });
  await writeFile(filePath, Buffer.from(await video.arrayBuffer()));

  let videoVersion;
  try {
    videoVersion = await prisma.$transaction(async (transaction) => {
      const createdVersion = await transaction.videoVersion.create({
        data: {
          projectId,
          number: nextNumber,
          fileName: video.name,
          storagePath,
          mimeType: video.type || mimeTypes[fileExtension],
          fileSize: video.size,
        },
      });

      await transaction.project.update({
        where: { id: projectId },
        data: {
          currentVersion: nextNumber.toString().padStart(2, "0"),
          status: "Em revisão",
        },
      });

      return createdVersion;
    });
  } catch (error) {
    await rm(filePath, { force: true });
    throw error;
  }

  return Response.json(toVideoVersionDto(videoVersion), { status: 201 });
}
