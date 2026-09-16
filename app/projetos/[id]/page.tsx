import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectReviewPanels from "../../components/ProjectReviewPanels";
import ReviewLinkPanel from "../../components/ReviewLinkPanel";
import Sidebar from "../../components/Sidebar";
import {
  toChangeRequestDto,
  toProjectDto,
  toVideoVersionDto,
} from "../../lib/presenters";
import { prisma } from "../../lib/prisma";
import {
  mockChangeRequests,
  mockProjects,
  mockVideoVersions,
} from "../../lib/mock-data";

export const dynamic = "force-dynamic";

export default async function ProjectDetailsPage({
  params,
}: PageProps<"/projetos/[id]">) {
  const { id } = await params;
  const databaseProject = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      client: { select: { name: true } },
      _count: { select: { changeRequests: true } },
      videoVersions: { orderBy: { number: "desc" } },
      changeRequests: { orderBy: { createdAt: "desc" } },
    },
  });
  const project = databaseProject
    ? toProjectDto(databaseProject)
    : mockProjects.find((mockProject) => mockProject.id === Number(id));

  if (!project) {
    notFound();
  }

  const videoVersions = databaseProject
    ? databaseProject.videoVersions.map(toVideoVersionDto)
    : mockVideoVersions.filter((videoVersion) => videoVersion.projectId === project.id);
  const changeRequests = databaseProject
    ? databaseProject.changeRequests.map(toChangeRequestDto)
    : mockChangeRequests.filter((changeRequest) => changeRequest.projectId === project.id);

  return (
    <main className="min-h-screen bg-[#0d0d0f] text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1 p-8">
          <Link
            href="/projetos"
            className="text-sm text-zinc-500 transition hover:text-white"
          >
            ← Voltar para projetos
          </Link>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">{project.client}</p>
              <h1 className="mt-1 text-2xl font-semibold">{project.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                {project.description || "Sem descrição."}
              </p>
            </div>

            <span className="rounded-full bg-[#262429] px-3 py-1.5 text-xs text-[#aaa4b0]">
              {project.status}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
              <p className="text-sm text-zinc-500">Versão atual</p>
              <strong className="mt-3 block text-2xl">V{project.version}</strong>
            </div>

            <div className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
              <p className="text-sm text-zinc-500">Solicitações</p>
              <strong className="mt-3 block text-2xl">{project.requests}</strong>
            </div>

            <div className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
              <p className="text-sm text-zinc-500">Progresso da revisão</p>
              <strong className="mt-3 block text-2xl">{project.progress}%</strong>
            </div>
          </div>

          {databaseProject && (
            <ReviewLinkPanel
              projectId={project.id}
              reviewToken={databaseProject.reviewToken}
              initialReviewEnabled={databaseProject.reviewEnabled}
            />
          )}

          <ProjectReviewPanels
            projectId={project.id}
            videoVersions={videoVersions}
            changeRequests={changeRequests}
          />
        </section>
      </div>
    </main>
  );
}
