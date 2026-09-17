import { requireEditor, withEditor } from "../../lib/auth";
import { reviewActivity } from "../../lib/review-activity";
import { prisma } from "../../lib/prisma";
import { workerIsOnline } from "../../lib/video-jobs";
async function get() {
  const editor = await requireEditor();
  const activity = await reviewActivity({ editorId: editor.id });
  const worker = await prisma.workerState.findUnique({ where: { id: "video-worker" } });
  return Response.json({ ...activity, online: workerIsOnline(worker?.heartbeat), lastBackupAt: worker?.lastBackupAt, backupError: worker?.backupError }, { headers: { "Cache-Control": "no-store" } });
}
export const GET = withEditor(get);
