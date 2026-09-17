import { prisma } from "../../../../lib/prisma";
import { validateReviewerName } from "../../../../lib/review-collaboration";

export async function POST(request: Request, { params }: RouteContext<"/api/revisao/[token]/aprovacao">) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  if (!Number.isSafeInteger(body?.videoVersionId) || body.videoVersionId <= 0) return Response.json({ error: "Versão inválida." }, { status: 400 });
  const name = validateReviewerName(body.authorName);
  if ("error" in name) return Response.json(name, { status: 400 });
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({ where: { reviewToken: token, reviewEnabled: true }, select: { id: true } });
    if (!project) return Response.json({ error: "Link de revisão indisponível." }, { status: 404 });
    const latest = await tx.videoVersion.findFirst({ where: { projectId: project.id }, orderBy: { number: "desc" }, include: { decisions: { orderBy: { id: "desc" }, take: 1 } } });
    if (!latest || !latest.storagePath) return Response.json({ error: "Vídeo não encontrado." }, { status: 404 });
    if (latest.id !== body.videoVersionId) return Response.json({ error: "Uma versão mais recente está disponível. Atualize a página antes de aprovar." }, { status: 409 });
    const pending = await tx.changeRequest.count({ where: { videoVersionId: latest.id, status: { not: "Resolvido" } } });
    if (pending) return Response.json({ error: "Existem ajustes em aberto nesta versão. Aguarde a resolução e atualize o status." }, { status: 409 });
    if (latest.decisions[0]?.status !== "Aprovado") await tx.reviewDecision.create({ data: { videoVersionId: latest.id, status: "Aprovado", authorName: name.name } });
    return Response.json({ status: "Aprovado" });
  });
}
