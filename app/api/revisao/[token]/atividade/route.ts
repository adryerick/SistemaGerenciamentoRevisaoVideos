import { reviewActivity } from "../../../../lib/review-activity";
export async function GET(_request: Request, { params }: RouteContext<"/api/revisao/[token]/atividade">) {
  const { token } = await params;
  const activity = await reviewActivity({ reviewToken: token, reviewEnabled: true });
  if (!activity.available) return Response.json({ error: "Link indisponível." }, { status: 404 });
  return Response.json({ signature: activity.signature }, { headers: { "Cache-Control": "no-store" } });
}
