import Link from "next/link";
import Sidebar from "../components/Sidebar";
import ProjectCard from "../components/ProjectCard";
import { getDemoEditor } from "../lib/demo-editor";
import { toProjectDto } from "../lib/presenters";
import { prisma } from "../lib/prisma";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const editor = await getDemoEditor();
  const [projects, clientsCount, videoVersionsCount, pendingRequestsCount, latestChangeRequests] =
    await Promise.all([
      prisma.project.findMany({
        where: { editorId: editor.id },
        include: {
          client: { select: { name: true } },
          _count: { select: { changeRequests: true } },
          changeRequests: { select: { status: true } },
          videoVersions: { orderBy: { number: "desc" }, take: 1, select: { id: true, storagePath: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.client.count({ where: { editorId: editor.id } }),
      prisma.videoVersion.count({ where: { project: { editorId: editor.id } } }),
      prisma.changeRequest.count({
        where: { project: { editorId: editor.id }, status: { not: "Resolvido" } },
      }),
      prisma.changeRequest.findMany({
        where: { project: { editorId: editor.id } },
        include: { project: { include: { client: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);
  const projectCards = projects.map(toProjectDto);
  const activeProjects = projectCards.filter(
    (project) => project.status !== "Resolvido",
  );

  return (
    <main className="min-h-screen bg-[#0d0d0f] text-white">
      <div className="flex min-h-screen flex-col sm:flex-row">

        {/* SIDEBAR */}
        <Sidebar />

        {/* CONTEÚDO */}
        <section className="relative min-w-0 flex-1 p-4 sm:p-8">

          {/* HEADER */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Dashboard
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Visão geral do seu fluxo de revisão.
              </p>
            </div>

            <Link
              href="/projetos"
              className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              + Novo projeto
            </Link>
          </div>

          {/* MÉTRICAS */}
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
              <p className="text-sm text-zinc-500">
                Projetos ativos
              </p>

              <strong className="mt-3 block text-3xl">
                {activeProjects.length}
              </strong>

              <p className="mt-2 text-xs text-zinc-600">
                Em andamento ou aguardando cliente
              </p>
            </div>

            <div className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
              <p className="text-sm text-zinc-500">
                Solicitações pendentes
              </p>

              <strong className="mt-3 block text-3xl">
                {pendingRequestsCount}
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
                {videoVersionsCount}
              </strong>

              <p className="mt-2 text-xs text-zinc-600">
                No histórico de projetos
              </p>
            </div>

            <div className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
              <p className="text-sm text-zinc-500">
                Clientes
              </p>

              <strong className="mt-3 block text-3xl">
                {clientsCount}
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

            {projectCards.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {projectCards.length === 0 && <p className="rounded-xl border border-dashed border-[#29292d] px-5 py-8 text-sm text-zinc-500">Você ainda não tem projetos. Crie o primeiro para começar a revisão.</p>}

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

          <div className="overflow-x-auto rounded-xl border border-[#29292d] bg-[#151517]">

            <div className="grid min-w-[640px] grid-cols-5 gap-3 border-b border-[#29292d] px-5 py-3 text-[11px] uppercase tracking-wide text-zinc-600">
              <span>Projeto</span>
              <span>Cliente</span>
              <span>Minutagem</span>
              <span>Solicitação</span>
              <span>Status</span>
            </div>

            {latestChangeRequests.map((request) => (
              <div
                key={request.id}
                className="grid min-w-[640px] grid-cols-5 items-center gap-3 border-b border-[#29292d] px-5 py-4 text-sm break-words last:border-b-0"
              >
                <span>{request.project.name}</span>
                <span className="text-zinc-500">{request.project.client.name}</span>
                <span className="text-zinc-400">{request.timestamp ?? "—"}</span>
                <span className="text-zinc-400">{request.comment}</span>
                <span className="text-zinc-400">{request.status}</span>
              </div>
            ))}
            {latestChangeRequests.length === 0 && <p className="px-5 py-8 text-sm text-zinc-500">Nenhuma solicitação recebida ainda.</p>}

          </div>

        </section>
      </div>
    </main>
  );
}
