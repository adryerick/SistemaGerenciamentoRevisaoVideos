"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Project } from "../types";

export default function ProjectThumbnail({ project }: { project: Project }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const showImage = !!project.thumbnailUrl && failedSource !== project.thumbnailUrl;
  return <Link href={`/projetos/${project.id}`} aria-label={`Abrir vídeos do projeto ${project.name}`}
    className="group relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-[#2e2e32] to-[#171719] focus-visible:outline-2 focus-visible:outline-white">
    {showImage && <Image src={project.thumbnailUrl!} alt={`Prévia do vídeo mais recente de ${project.name}`} fill unoptimized sizes="(min-width: 1280px) 50vw, 100vw"
      className="object-contain transition group-hover:brightness-75" onError={() => setFailedSource(project.thumbnailUrl!)} />}
    <span aria-hidden="true" className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/40 text-xl text-white shadow-lg transition group-hover:bg-black/60">▶</span>
    <span className="absolute bottom-3 left-3 z-10 rounded bg-black/70 px-2 py-1 text-[11px] text-zinc-200">{showImage ? "Prévia da última versão" : project.thumbnailUrl ? "Prévia indisponível · abrir vídeo" : "Ainda sem vídeo"}</span>
  </Link>;
}
