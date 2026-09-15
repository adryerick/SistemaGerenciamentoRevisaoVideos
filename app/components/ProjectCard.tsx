import type { Project } from "../types";

type ProjectCardProps = {
  project: Project;
};

export default function ProjectCard({
  project,
}: ProjectCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#29292d] bg-[#151517]">

      {/* THUMBNAIL */}
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#2e2e32] to-[#171719]">

        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl">
          ▶
        </div>

      </div>

      {/* CONTEÚDO */}
      <div className="p-5">

        <div className="mb-4 flex items-center justify-between">

          <span className="rounded-full bg-[#222225] px-2.5 py-1 text-[11px] text-zinc-300">
            V{project.version}
          </span>

          <span className="rounded-full bg-[#262429] px-2.5 py-1 text-[11px] text-[#aaa4b0]">
            {project.status}
          </span>

        </div>

        <h3 className="text-lg font-semibold">
          {project.name}
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          {project.client}
        </p>

        <p className="mt-3 text-xs leading-5 text-zinc-600">
          {project.description || "Sem descrição."}
        </p>

        {/* PROGRESSO */}
        <div className="mt-6">

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
              className="h-full rounded-full bg-[#77717f]"
              style={{
                width: `${project.progress}%`,
              }}
            />

          </div>

        </div>

        {/* RODAPÉ */}
        <div className="mt-6 flex items-center justify-between">

          <span className="text-xs text-zinc-500">
            {project.requests} solicitações
          </span>

          <button className="rounded-lg border border-[#303035] bg-[#1b1b1e] px-3 py-2 text-xs text-zinc-300 transition hover:bg-[#232328]">
            Gerenciar
          </button>

        </div>

      </div>
    </div>
  );
}