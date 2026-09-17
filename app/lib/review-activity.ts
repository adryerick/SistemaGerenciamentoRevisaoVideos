import { createHash } from "node:crypto";
import { prisma } from "./prisma";

export async function reviewActivity(where: { editorId: number } | { reviewToken: string; reviewEnabled: boolean }) {
  const projects = await prisma.project.findMany({ where, select: { id: true, name: true,
    videoVersions: { select: { id: true, number: true, decisions: { orderBy: { id: "desc" }, take: 1, select: { id: true, status: true } } }, orderBy: { number: "desc" } },
    changeRequests: { select: { id: true, status: true, priority: true, replies: { select: { id: true, role: true }, orderBy: { id: "desc" }, take: 1 }, _count: { select: { replies: true } } }, orderBy: { id: "desc" } },
    videoJobs: { select: { id: true, status: true }, orderBy: { id: "asc" } },
  }, orderBy: { id: "asc" } });
  const signature = createHash("sha256").update(JSON.stringify(projects)).digest("hex");
  const pending = projects.reduce((count, project) => count + project.changeRequests.filter((request) => request.status !== "Resolvido").length, 0);
  return { available: projects.length > 0, signature, pending };
}
