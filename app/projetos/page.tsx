"use client";

import { useEffect, useState } from "react";
import NewProjectModal from "../components/NewProjectModal";
import ProjectCard from "../components/ProjectCard";
import Sidebar from "../components/Sidebar";
import { mockClients, mockProjects } from "../lib/mock-data";
import type { Client, Project } from "../types";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [clients, setClients] = useState<Client[]>(mockClients);
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
      const [projectsResponse, clientsResponse] = await Promise.all([
        fetch("/api/projetos"),
        fetch("/api/clients"),
      ]);

      if (projectsResponse.ok) {
        setProjects(await projectsResponse.json());
      }

      if (clientsResponse.ok) {
        setClients(await clientsResponse.json());
      }
    }

    void loadData();
  }, []);

  async function handleCreateProject(project: Omit<Project, "id">) {
    try {
      const response = await fetch("/api/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      const result = await response.json();

      if (!response.ok) {
        alert(result.error ?? "Não foi possível criar o projeto.");
        return;
      }

      setProjects((currentProjects) => [result, ...currentProjects]);
      setShowModal(false);
    } catch {
      alert("Não foi possível conectar ao banco de dados.");
    }
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
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar projeto..."
              className="w-72 rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-2.5 text-sm text-zinc-300 outline-none"
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

            {filteredProjects.length > 0 ? (
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

          <NewProjectModal
            isOpen={showModal}
            clients={clients}
            onClose={() => setShowModal(false)}
            onCreate={handleCreateProject}
          />

        </section>

      </div>
    </main>
  );
}
