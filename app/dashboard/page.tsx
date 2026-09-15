import Sidebar from "../components/Sidebar";

const projects = [
  {
    name: "VSL — Curso Motion",
    client: "Cliente Demo",
    version: "03",
    status: "Em revisão",
    requests: 3,
    progress: 72,
  },
  {
    name: "Reel — Lançamento",
    client: "Studio X",
    version: "02",
    status: "Pendente",
    requests: 2,
    progress: 44,
  },
  {
    name: "Ad — Produto",
    client: "Marca Alpha",
    version: "05",
    status: "Resolvido",
    requests: 0,
    progress: 100,
  },
];

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

            {projects.map((project) => (
              <div
                key={project.name}
                className="overflow-hidden rounded-xl border border-[#29292d] bg-[#151517]"
              >

                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#2e2e32] to-[#171719]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg">
                    ▶
                  </div>
                </div>

                <div className="p-5">

                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-[#222225] px-2.5 py-1 text-[11px] text-zinc-300">
                      V{project.version}
                    </span>

                    <span className="text-[11px] text-zinc-500">
                      {project.status}
                    </span>
                  </div>

                  <h4 className="text-base font-semibold">
                    {project.name}
                  </h4>

                  <p className="mt-1 text-xs text-zinc-500">
                    {project.client}
                  </p>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">
                        Progresso
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

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {project.requests} solicitações
                    </span>

                    <button className="rounded-lg border border-[#303035] bg-[#1b1b1e] px-3 py-2 text-xs text-zinc-300 transition hover:bg-[#232328]">
                      Gerenciar
                    </button>
                  </div>

                </div>
              </div>
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