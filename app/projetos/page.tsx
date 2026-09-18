"use client";

import { useEffect, useState } from "react";
import NewProjectModal from "../components/NewProjectModal";
import ProjectCard from "../components/ProjectCard";
import Sidebar from "../components/Sidebar";
import type { Client, Project } from "../types";
import type { NewProjectInput } from "../lib/project-input";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos os status");

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    const matchesStatus =
      selectedStatus === "Todos os status" || project.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsResponse, clientsResponse] = await Promise.all([
          fetch("/api/projetos"),
          fetch("/api/clients"),
        ]);

        if (!projectsResponse.ok || !clientsResponse.ok) {
          setLoadError(true);
          return;
        }

        const [loadedProjects, loadedClients] = await Promise.all([
          projectsResponse.json(),
          clientsResponse.json(),
        ]);
        setProjects(loadedProjects);
        setClients(loadedClients);
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  async function handleCreateProject(project: NewProjectInput) {
    const response = await fetch("/api/projetos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    }).catch(() => {
      throw new Error("Falha de conexão. Confira se o servidor está em execução e tente novamente.");
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(response.status === 401 ? "Sua sessão expirou. Entre novamente; o projeto ainda não foi criado." : result.error ?? "Não foi possível criar o projeto.");
    }

    setProjects((currentProjects) => [result, ...currentProjects]);
  }

  async function handleDeleteProject(project: Project) {
    const confirmed = window.confirm(
      `Excluir o projeto “${project.name}”? As versões e solicitações vinculadas também serão removidas.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/projetos/${project.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        alert(result.error ?? "Não foi possível excluir o projeto.");
        return;
      }

      setProjects((currentProjects) =>
        currentProjects.filter((currentProject) => currentProject.id !== project.id),
      );
    } catch {
      alert("Não foi possível conectar ao banco de dados.");
    }
  }

  return (
    <main className="vr-workspace min-h-screen bg-[#0d0d0f] text-white">
      <div className="flex min-h-screen flex-col sm:flex-row">

        {/* SIDEBAR */}

        <Sidebar />       

        {/* CONTEÚDO */}
        <section className="relative min-w-0 flex-1 p-4 sm:p-8">

          {/* HEADER */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">

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
              disabled={isLoading}
              className="vr-primary shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              + Novo projeto
            </button>

          </div>

          {/* FILTROS */}
          <div className="mb-6 flex flex-wrap items-center gap-3">

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar projeto..."
              aria-label="Buscar projeto"
              className="w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500 sm:w-72"
            />

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              aria-label="Filtrar projetos por status"
              className="w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-2.5 text-sm text-zinc-300 outline-none sm:w-auto"
            >
              <option>Todos os status</option>
              <option>Em revisão</option>
              <option>Pendente</option>
              <option>Aguardando cliente</option>
              <option>Resolvido</option>
            </select>

          </div>

          {/* PROJETOS */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

            {isLoading ? (
              <p className="rounded-xl border border-[#29292d] bg-[#151517] px-5 py-8 text-sm text-zinc-500">
                Carregando projetos...
              </p>
            ) : loadError ? (
              <p className="rounded-xl border border-red-950 bg-red-950/20 px-5 py-8 text-sm text-red-300">
                Não foi possível carregar os projetos. Atualize a página e tente novamente.
              </p>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDeleteProject}
                />
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#29292d] px-5 py-8 text-sm text-zinc-500">
                Nenhum projeto encontrado com esses filtros.
              </p>
            )}

          </div>

          {showModal && <NewProjectModal
            isOpen={showModal}
            clients={clients}
            onClose={() => setShowModal(false)}
            onCreate={handleCreateProject}
          />}

        </section>

      </div>
    </main>
  );
}
