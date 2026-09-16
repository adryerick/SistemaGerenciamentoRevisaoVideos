import { toVideoVersionDto } from "../../../../lib/presenters";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/projetos/[id]/versoes">,
) {
  const { id } = await params;
  const projectId = Number(id);
  const { fileName } = await request.json();
  const normalizedFileName =
    typeof fileName === "string" ? fileName.trim() : "";

  if (!normalizedFileName) {
    return Response.json({ error: "Informe o nome do arquivo." }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { videoVersions: { select: { number: true } } },
  });

  if (!project) {
    return Response.json({ error: "Projeto não encontrado." }, { status: 404 });
  }

  const nextNumber = Math.max(0, ...project.videoVersions.map((version) => version.number)) + 1;
  const videoVersion = await prisma.videoVersion.create({
    data: { projectId, number: nextNumber, fileName: normalizedFileName },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { currentVersion: nextNumber.toString().padStart(2, "0"), status: "Em revisão" },
  });

  return Response.json(toVideoVersionDto(videoVersion), { status: 201 });
}
