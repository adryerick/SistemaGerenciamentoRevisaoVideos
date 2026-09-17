import { notFound } from "next/navigation";
import PublicReviewForm from "../../components/PublicReviewForm";
import { toChangeRequestDto, toVideoVersionDto } from "../../lib/presenters";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicReviewPage({
  params,
}: PageProps<"/revisao/[token]">) {
  const { token } = await params;
  const project = await prisma.project.findFirst({
    where: { reviewToken: token, reviewEnabled: true },
    select: {
      name: true,
      description: true,
      videoVersions: { orderBy: { number: "desc" } },
      changeRequests: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) {
    notFound();
  }

  const videoVersions = project.videoVersions.map(toVideoVersionDto);

  return (
    <main className="min-h-screen bg-[#0d0d0f] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium text-zinc-500">VideoReview</p>
        <h1 className="mt-3 text-3xl font-semibold">{project.name}</h1>
        {project.description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            {project.description}
          </p>
        )}

        <div className="mt-8">
          <PublicReviewForm reviewToken={token} videoVersions={videoVersions}
            changeRequests={project.changeRequests.map(toChangeRequestDto)} />
        </div>
      </div>
    </main>
  );
}
