import { postReviewReply } from "../../../../../../lib/review-replies";

export async function POST(request: Request, { params }: RouteContext<"/api/revisao/[token]/solicitacoes/[id]/respostas">) {
  const { token, id } = await params;
  return postReviewReply(request, id, { token });
}
