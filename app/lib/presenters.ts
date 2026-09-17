import type {
  ChangeRequest,
  Client,
  Project,
  VideoVersion,
} from "../types";

type ClientRecord = {
  id: number;
  name: string;
  email: string;
  status: string;
  _count: { projects: number };
};

type ProjectRecord = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  currentVersion: string;
  progress: number;
  client: { name: string };
  _count?: { changeRequests: number };
  changeRequests?: { status: string }[];
  videoVersions?: { id: number; storagePath: string | null }[];
};

type VideoVersionRecord = {
  id: number;
  projectId: number;
  number: number;
  fileName: string;
  storagePath: string | null;
  sentAt: Date;
  decisions?: { status: string; authorName: string | null; createdAt: Date }[];
};

type ChangeRequestRecord = {
  id: number;
  projectId: number;
  videoVersionId: number;
  comment: string;
  timestamp: string | null;
  status: string;
  createdAt: Date;
  authorName?: string | null;
  priority?: string;
  replies?: { id: number; comment: string; role: string; authorName: string | null; createdAt: Date }[];
};

export function toClientDto(client: ClientRecord): Client {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    projects: client._count.projects,
    status: client.status,
  };
}

export function toProjectDto(project: ProjectRecord): Project {
  return {
    id: project.id,
    name: project.name,
    client: project.client.name,
    version: project.currentVersion,
    status: project.status,
    requests: project._count?.changeRequests ?? 0,
    progress: project.changeRequests
      ? (project.changeRequests.length ? Math.round(100 * project.changeRequests.filter((request) => request.status === "Resolvido").length / project.changeRequests.length) : 0)
      : project.progress,
    description: project.description ?? "",
    thumbnailUrl: project.videoVersions?.[0]?.storagePath ? `/api/projetos/${project.id}/versoes/${project.videoVersions[0].id}/miniatura` : undefined,
  };
}

export function toVideoVersionDto(version: VideoVersionRecord): VideoVersion {
  return {
    id: version.id,
    projectId: version.projectId,
    number: version.number,
    fileName: version.fileName,
    videoUrl: version.storagePath ? `/api/projetos/${version.projectId}/versoes/${version.id}/video` : undefined,
    sentAt: version.sentAt.toLocaleDateString("pt-BR"),
    reviewStatus: version.decisions?.[0]?.status ?? "Em revisão",
    reviewedBy: version.decisions?.[0]?.authorName ?? undefined,
    reviewedAt: version.decisions?.[0]?.createdAt.toLocaleString("pt-BR"),
  };
}

export function toChangeRequestDto(
  request: ChangeRequestRecord,
): ChangeRequest {
  const status = ["Pendente", "Em andamento", "Resolvido"].includes(request.status)
    ? request.status
    : "Pendente";

  return {
    id: request.id,
    projectId: request.projectId,
    videoVersionId: request.videoVersionId,
    comment: request.comment,
    timestamp: request.timestamp ?? undefined,
    status: status as ChangeRequest["status"],
    createdAt: request.createdAt.toLocaleDateString("pt-BR"),
    authorName: request.authorName ?? undefined,
    priority: (["Alta", "Normal", "Baixa"].includes(request.priority ?? "") ? request.priority : "Normal") as ChangeRequest["priority"],
    replies: request.replies?.map((reply) => ({ ...reply, authorName: reply.authorName ?? undefined, createdAt: reply.createdAt.toLocaleString("pt-BR") })) ?? [],
  };
}
