"use client";
import ProjectCard from "../components/ProjectCard";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

type Project = {
  name: string;
  client: string;
  version: string;
  status: string;
  requests: number;
  progress: number;
  description: string;
};

const initialProjects: Project[] = [
  {
    name: "VSL — Curso Motion",
    client: "Cliente Demo",
    version: "03",
    status: "Em revisão",
    requests: 3,
    progress: 72,
    description: "Projeto de VSL para curso de motion design.",
  },
  {
    name: "Reel — Lançamento",
    client: "Studio X",
    version: "02",
    status: "Pendente",
    requests: 2,
    progress: 44,
    description: "Reel para campanha de lançamento.",
  },
  {
    name: "Ad — Produto",
    client: "Marca Alpha",
    version: "05",
    status: "Resolvido",
    requests: 0,
    progress: 100,
    description: "Criativo para campanha de produto.",
  },
  {
    name: "Institucional 2026",
    client: "Cliente Demo",
    version: "01",
    status: "Aguardando cliente",
    requests: 1,
    progress: 88,
    description: "Vídeo institucional da empresa.",
  },
  {
    name: "VSL — Black Friday",
    client: "Studio X",
    version: "04",
    status: "Em revisão",
    requests: 4,
    progress: 61,
    description: "VSL promocional de Black Friday.",
  },
  {
    name: "Social Ads — Q4",
    client: "Marca Alpha",
    version: "02",
    status: "Pendente",
    requests: 5,
    progress: 33,
    description: "Pacote de anúncios para redes sociais.",
  },
];

function getStatusColor(status: string) {
  if (status === "Resolvido") {
    return "bg-[#242a26] text-[#9bb0a2]";
  }

  if (status === "Pendente") {
    return "bg-[#2a2723] text-[#b4a585]";
  }

  if (status === "Aguardando cliente") {
    return "bg-[#24272b] text-[#9ba7b5]";
  }

  return "bg-[#262429] text-[#aaa4b0]";
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [client, setClient] = useState("Cliente Demo");
  const [description, setDescription] = useState("");

  function createProject() {
    if (!name.trim()) {
      alert("Informe o nome do projeto.");
      return;
    }

    const newProject: Project = {
      name: name.trim(),
      client,
      version: "01",
      status: "Pendente",
      requests: 0,
      progress: 0,
      description: description.trim(),
    };

    setProjects((currentProjects) => [
      newProject,
      ...currentProjects,
    ]);

    setName("");
    setClient("Cliente Demo");
    setDescription("");
    setShowModal(false);
  }

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
                Projetos
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Gerencie seus trabalhos, versões e revisões.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              + Novo projeto
            </button>

          </div>

          {/* FILTROS */}
          <div className="mb-6 flex items-center gap-3">

            <input
              type="text"
              placeholder="Buscar projeto..."
              className="w-72 rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />

            <select className="rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-2.5 text-sm text-zinc-300 outline-none">
              <option>Todos os status</option>
              <option>Em revisão</option>
              <option>Pendente</option>
              <option>Aguardando cliente</option>
              <option>Resolvido</option>
            </select>

          </div>

          {/* PROJETOS */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

            {projects.map((project) => (
            
            <ProjectCard
              key={`${project.name}-${project.version}`}
              project={project}
            />
            ))}

          </div>

          {/* MODAL */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

              <div className="w-full max-w-lg rounded-2xl border border-[#29292d] bg-[#151517] p-6 shadow-2xl">

                <div className="mb-6 flex items-center justify-between">

                  <div>
                    <h3 className="text-lg font-semibold">
                      Novo projeto
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Cadastre um novo projeto para iniciar a revisão.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowModal(false)}
                    className="text-xl text-zinc-500 hover:text-white"
                  >
                    ×
                  </button>

                </div>

                <div className="space-y-5">

                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">
                      Nome do projeto
                    </label>

                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ex.: VSL — Produto X"
                      className="w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">
                      Cliente
                    </label>

                    <select
                      value={client}
                      onChange={(event) => setClient(event.target.value)}
                      className="w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-zinc-500"
                    >
                      <option>Cliente Demo</option>
                      <option>Studio X</option>
                      <option>Marca Alpha</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">
                      Descrição
                    </label>

                    <textarea
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Descreva brevemente o projeto..."
                      rows={4}
                      className="w-full resize-none rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
                    />
                  </div>

                </div>

                <div className="mt-7 flex justify-end gap-3">

                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded-lg border border-[#303035] bg-[#1b1b1e] px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#232328]"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={createProject}
                    className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200"
                  >
                    Criar projeto
                  </button>

                </div>

              </div>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}