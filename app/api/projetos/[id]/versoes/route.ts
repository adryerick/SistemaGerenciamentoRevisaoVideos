import { withEditor } from "../../../../lib/auth";
import { getDemoEditor } from "../../../../lib/demo-editor";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { toVideoVersionDto } from "../../../../lib/presenters";
import { prisma } from "../../../../lib/prisma";
import { convertVideoForBrowser, VideoConversionError } from "../../../../lib/video-conversion";
import { MAX_VIDEO_SIZE, validateVideoFile } from "../../../../lib/video-formats";

export const runtime = "nodejs";

async function handlePOST(
  request: Request,
  { params }: RouteContext<"/api/projetos/[id]/versoes">,
) {
  const { id } = await params;
  const projectId = Number(id);
  const editor = await getDemoEditor();
  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > MAX_VIDEO_SIZE + 1024 * 1024) {
    return Response.json({ error: "O vídeo deve ter no máximo 250 MB." }, { status: 413 });
  }
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "O envio foi interrompido ou o arquivo não chegou completo. Verifique a conexão e tente novamente; o vídeo selecionado será mantido." }, { status: 400 });
  }
  const video = formData.get("video");

  if (!Number.isInteger(projectId)) {
    return Response.json({ error: "Projeto inválido." }, { status: 400 });
  }

  if (!video || typeof video === "string" || video.size === 0) {
    return Response.json({ error: "Selecione um arquivo de vídeo." }, { status: 400 });
  }

  const validationError = validateVideoFile(video.name, video.size);
  if (validationError) return Response.json({ error: validationError }, { status: 400 });
  const directory = path.join(process.cwd(), "public", "uploads", "projects", String(projectId));
  const storedFileName = `${randomUUID()}.mp4`;
  const filePath = path.join(directory, storedFileName);
  const storagePath = `/uploads/projects/${projectId}/${storedFileName}`;

  let temporaryDirectory: string | undefined;
  let publishedFile = false;
  try {
    const project = await prisma.project.findFirst({ where: { id: projectId, editorId: editor.id }, select: { id: true } });
    if (!project) return Response.json({ error: "Projeto não encontrado." }, { status: 404 });

    temporaryDirectory = await mkdtemp(path.join(tmpdir(), "videoreview-convert-"));
    const input = path.join(temporaryDirectory, "input");
    const output = path.join(temporaryDirectory, "playback.mp4");
    await writeFile(input, Buffer.from(await video.arrayBuffer()));
    await convertVideoForBrowser(input, output);
    const fileInfo = await stat(output);
    await mkdir(directory, { recursive: true });
    publishedFile = true;
    await copyFile(output, filePath);

    const videoVersion = await prisma.$transaction(async (transaction) => {
      const latest = await transaction.videoVersion.findFirst({
        where: { projectId }, orderBy: { number: "desc" }, select: { number: true },
      });
      const nextNumber = (latest?.number ?? 0) + 1;
      const createdVersion = await transaction.videoVersion.create({
        data: {
          projectId,
          number: nextNumber,
          fileName: video.name,
          storagePath,
          mimeType: "video/mp4",
          fileSize: fileInfo.size,
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
    return Response.json(toVideoVersionDto(videoVersion), { status: 201 });
  } catch (error) {
    if (publishedFile) await rm(filePath, { force: true }).catch(console.error);
    if (error instanceof VideoConversionError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Falha ao salvar vídeo", error);
    return Response.json({ error: "Não foi possível salvar o vídeo. Verifique o espaço em disco e reinicie o servidor se o banco foi atualizado." }, { status: 500 });
  } finally {
    if (temporaryDirectory && path.resolve(temporaryDirectory).startsWith(path.join(path.resolve(tmpdir()), "videoreview-convert-"))) {
      await rm(temporaryDirectory, { recursive: true, force: true }).catch(console.error);
    }
  }
}

async function handleDELETE(
  request: Request,
  { params }: RouteContext<"/api/projetos/[id]/versoes">,
) {
  const { id } = await params;
  const projectId = Number(id);
  const editor = await getDemoEditor();

  if (!Number.isInteger(projectId)) {
    return Response.json({ error: "Projeto inválido." }, { status: 400 });
  }

  const body = await request.json();
  const versionId = Number(body.versionId);

  if (!Number.isInteger(versionId)) {
    return Response.json({ error: "Versão inválida." }, { status: 400 });
  }

  const videoVersion = await prisma.videoVersion.findFirst({
    where: {
      id: versionId,
      projectId,
      project: { editorId: editor.id },
    },
  });

  if (!videoVersion) {
    return Response.json({ error: "Versão não encontrada." }, { status: 404 });
  }

  const filePath = videoVersion.storagePath
  ? path.join(
      process.cwd(),
      "public",
      videoVersion.storagePath.slice(1),
    )
  : null;

  await prisma.videoVersion.delete({
    where: {
      id: videoVersion.id,
    },
  });

 if (filePath && path.resolve(filePath).startsWith(`${path.resolve(process.cwd(), "public", "uploads", "projects", String(projectId))}${path.sep}`)) {
  await rm(filePath, { force: true });
}

  const latestVersion = await prisma.videoVersion.findFirst({
    where: {
      projectId,
    },
    orderBy: {
      number: "desc",
    },
  });

  await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      currentVersion: latestVersion
    ? latestVersion.number.toString().padStart(2, "0")
    : "",
      status: latestVersion ? "Em revisão" : "Pendente",
    },
  });

  return Response.json({ success: true });
}

export const POST = withEditor(handlePOST);
export const DELETE = withEditor(handleDELETE);
