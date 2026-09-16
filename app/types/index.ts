export type Client = {
  id: number;
  name: string;
  email: string;
  projects: number;
  status: string;
};

export type Project = {
  id: number;
  name: string;
  client: string;
  version: string;
  status: string;
  requests: number;
  progress: number;
  description: string;
};

export type VideoVersion = {
  id: number;
  projectId: number;
  number: number;
  sentAt: string;
  fileName: string;
};

export type ChangeRequest = {
  id: number;
  projectId: number;
  videoVersionId: number;
  comment: string;
  timestamp?: string;
  status: "Pendente" | "Em andamento" | "Resolvido";
  createdAt: string;
};
