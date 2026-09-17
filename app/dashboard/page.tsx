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

            <Link
              href="/projetos"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
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

            {latestChangeRequests.map((request) => (
              <div
                key={request.id}
                className="grid grid-cols-5 items-center border-b border-[#29292d] px-5 py-4 text-sm last:border-b-0"
              >
                <span>{request.project.name}</span>
                <span className="text-zinc-500">{request.project.client.name}</span>
                <span className="text-zinc-400">{request.timestamp ?? "—"}</span>
                <span className="text-zinc-400">{request.comment}</span>
                <span className="text-zinc-400">{request.status}</span>
              </div>
            ))}

          </div>

        </section>
      </div>
    </main>
  );
}
