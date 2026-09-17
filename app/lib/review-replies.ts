import { prisma } from "./prisma";
import { validateReply } from "./review-collaboration";

export async function postReviewReply(request: Request, id: string, access: { token: string } | { editorId: number; name: string }) {
  const requestId = Number(id);
  if (!Number.isSafeInteger(requestId) || requestId <= 0) return Response.json({ error: "Solicitação inválida." }, { status: 400 });
  const input = validateReply(await request.json().catch(() => null));
  if ("error" in input) return Response.json(input, { status: 400 });
  return prisma.$transaction(async (tx) => {
    const existing = await tx.changeRequest.findFirst({
      where: { id: requestId, project: "token" in access ? { reviewToken: access.token, reviewEnabled: true } : { editorId: access.editorId } },
      select: { id: true, _count: { select: { replies: true } } },
    });
    if (!existing) return Response.json({ error: "Solicitação não encontrada ou link desativado." }, { status: 404 });
    if (existing._count.replies >= 100) return Response.json({ error: "Esta conversa atingiu o limite de 100 respostas." }, { status: 409 });
    const reply = await tx.reviewReply.create({ data: {
      requestId, comment: input.comment, role: "token" in access ? "Cliente" : "Editor",
      authorName: "token" in access ? input.name : access.name,
    } });
    return Response.json({ id: reply.id }, { status: 201 });
  });
}
