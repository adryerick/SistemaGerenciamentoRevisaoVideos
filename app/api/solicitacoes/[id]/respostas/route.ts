import { withEditor, requireEditor } from "../../../../lib/auth";
import { postReviewReply } from "../../../../lib/review-replies";

async function handlePOST(request: Request, { params }: RouteContext<"/api/solicitacoes/[id]/respostas">) {
  const { id } = await params;
  const editor = await requireEditor();
  return postReviewReply(request, id, { editorId: editor.id, name: editor.name });
}
export const POST = withEditor(handlePOST);
