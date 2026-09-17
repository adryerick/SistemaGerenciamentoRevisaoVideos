import { getAuthenticatedEditor } from "../../../lib/auth";

export async function GET() {
  const editor = await getAuthenticatedEditor();
  return Response.json({ authenticated: !!editor }, {
    status: editor ? 200 : 401,
    headers: { "Cache-Control": "private, no-store" },
  });
}
