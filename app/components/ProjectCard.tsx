import Link from "next/link";
import type { Project } from "../types";
import ProjectThumbnail from "./ProjectThumbnail";

type ProjectCardProps = {
  project: Project;
  onDelete?: (project: Project) => void;
};

export default function ProjectCard({
  project,
  onDelete,
}: ProjectCardProps) {
  return (
    <div className="vr-surface vr-project-card flex h-full flex-col overflow-hidden rounded-2xl border border-[#29292d] bg-[#151517]">

      {/* THUMBNAIL */}
      <ProjectThumbnail project={project} />

      {/* CONTEÚDO */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">

        <div className="mb-4 flex items-center justify-between">

          <span className="rounded-full bg-[#222225] px-2.5 py-1 text-[11px] text-zinc-300">
            V{project.version}
          </span>

          <span className="rounded-full bg-[#262429] px-2.5 py-1 text-[11px] text-[#aaa4b0]">
            {project.status}
          </span>

        </div>

        <h3 className="break-words text-xl font-semibold">
          {project.name}
        </h3>

        <p className="mt-1 text-sm text-zinc-400">
          {project.client}
        </p>

        <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-zinc-400">
          {project.description || "Sem descrição."}
        </p>

        {/* PROGRESSO */}
        <div className="mb-6 mt-6">

          <div className="mb-2 flex items-center justify-between">

            <span className="text-xs text-zinc-500">
              Progresso da revisão
            </span>

            <span className="text-xs text-zinc-400">
              {project.progress}%
            </span>

          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-[#29292d]">

            <div
              className="h-full rounded-full bg-emerald-300"
              style={{
                width: `${project.progress}%`,
              }}
            />

          </div>

        </div>

        {/* RODAPÉ */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-5">

          <span className="text-xs text-zinc-500">
            {project.requests} solicitações
          </span>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(project)}
                className="rounded-lg border border-red-950 bg-red-950/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-950/40"
              >
                Excluir
              </button>
            )}
            <Link
              href={`/projetos/${project.id}`}
              className="vr-primary rounded-lg border border-[#303035] bg-[#1b1b1e] px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-[#232328]"
            >
              Gerenciar
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
