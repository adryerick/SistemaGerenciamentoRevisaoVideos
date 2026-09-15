import Sidebar from "../components/Sidebar";
import ProjectCard from "../components/ProjectCard";  
import { mockProjects } from "../lib/mock-data";
export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#0d0d0f] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <Sidebar />

        {/* CONTEÚDO */}
        <section className="relative flex-1 p-8">

          {/* HEADER */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                Dashboard
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Visão geral do seu fluxo de revisão.
              </p>
            </div>

            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200">
              + Novo projeto
            </button>
          </div>

          {/* MÉTRICAS */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
              <p className="text-sm text-zinc-500">
                Projetos ativos
              </p>

              <strong className="mt-3 block text-3xl">
                4
              </strong>

              <p className="mt-2 text-xs text-zinc-600">
                Em revisão
              </p>
            </div>

            <div className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
              <p className="text-sm text-zinc-500">
                Solicitações pendentes
              </p>

              <strong className="mt-3 block text-3xl">
                7
              </strong>

              <p className="mt-2 text-xs text-zinc-600">
                Precisam de atenção
              </p>
            </div>

            <div className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
              <p className="text-sm text-zinc-500">
                Versões enviadas
              </p>

              <strong className="mt-3 block text-3xl">
                16
              </strong>

              <p className="mt-2 text-xs text-zinc-600">
                Nos últimos projetos
              </p>
            </div>

            <div className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
              <p className="text-sm text-zinc-500">
                Clientes
              </p>

              <strong className="mt-3 block text-3xl">
                12
              </strong>

              <p className="mt-2 text-xs text-zinc-600">
                Cadastrados
              </p>
            </div>

          </div>

          {/* PROJETOS */}
          <div className="mb-5">
            <h3 className="text-lg font-semibold">
              Projetos recentes
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Acompanhe o andamento das revisões.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

            {mockProjects.map((project) => (
            <ProjectCard
              key={project.name}
              project={project}
            />
          ))}

          </div>

          {/* SOLICITAÇÕES */}
          <div className="mb-5 mt-10">
            <h3 className="text-lg font-semibold">
              Últimas solicitações
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Feedback recebido dos clientes.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#29292d] bg-[#151517]">

            <div className="grid grid-cols-5 border-b border-[#29292d] px-5 py-3 text-[11px] uppercase tracking-wide text-zinc-600">
              <span>Projeto</span>
              <span>Cliente</span>
              <span>Minutagem</span>
              <span>Solicitação</span>
              <span>Status</span>
            </div>

            <div className="grid grid-cols-5 items-center border-b border-[#29292d] px-5 py-4 text-sm">
              <span>VSL — Curso Motion</span>
              <span className="text-zinc-500">Cliente Demo</span>
              <span className="text-zinc-400">00:23</span>
              <span className="text-zinc-400">
                Trocar texto da oferta.
              </span>
              <span className="text-zinc-400">Em andamento</span>
            </div>

            <div className="grid grid-cols-5 items-center border-b border-[#29292d] px-5 py-4 text-sm">
              <span>Reel — Lançamento</span>
              <span className="text-zinc-500">Studio X</span>
              <span className="text-zinc-400">00:41</span>
              <span className="text-zinc-400">
                Aumentar volume do SFX.
              </span>
              <span className="text-zinc-400">Pendente</span>
            </div>

            <div className="grid grid-cols-5 items-center px-5 py-4 text-sm">
              <span>Ad — Produto</span>
              <span className="text-zinc-500">Marca Alpha</span>
              <span className="text-zinc-400">01:12</span>
              <span className="text-zinc-400">
                Adicionar logo no final.
              </span>
              <span className="text-zinc-400">Resolvida</span>
            </div>

          </div>

        </section>
      </div>
    </main>
  );
}