"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ClientTable from "../components/ClientTable";
import NewClientModal from "../components/NewClientModal";
import type { Client } from "../types";

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch("/api/clients");

        if (!response.ok) {
          setLoadError(true);
          return;
        }

        setClients(await response.json());
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    }

    void loadClients();
  }, []);

  async function handleSaveClient(data: Pick<Client, "name" | "email">) {
    try {
      const response = await fetch(editingClient ? `/api/clients/${editingClient.id}` : "/api/clients", {
        method: editingClient ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        alert(result.error ?? "Não foi possível salvar o cliente.");
        return;
      }

      setClients((currentClients) =>
        editingClient
          ? currentClients.map((client) => client.id === result.id ? result : client)
          : [result, ...currentClients],
      );
      setEditingClient(null);
      setIsModalOpen(false);
    } catch {
      alert("Não foi possível conectar ao banco de dados.");
    }
  }

  async function handleDeleteClient(client: Client) {
    if (!window.confirm(`Excluir o cliente “${client.name}”?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        alert(result.error ?? "Não foi possível excluir o cliente.");
        return;
      }
      setClients((currentClients) => currentClients.filter((item) => item.id !== client.id));
    } catch {
      alert("Não foi possível conectar ao banco de dados.");
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0d0d0f] text-white">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Clientes</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Gerencie os clientes dos seus projetos.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingClient(null);
                setIsModalOpen(true);
              }}
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              + Novo cliente
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-[#29292d] bg-[#151517] px-5 py-10 text-sm text-zinc-500">
              Carregando clientes...
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-950 bg-red-950/20 px-5 py-10 text-sm text-red-300">
              Não foi possível carregar os clientes. Atualize a página e tente novamente.
            </div>
          ) : (
            <ClientTable
              clients={clients}
              onEdit={(client) => {
                setEditingClient(client);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteClient}
            />
          )}
        </div>
      </main>

      <NewClientModal
        key={editingClient?.id ?? "new"}
        isOpen={isModalOpen}
        client={editingClient}
        onClose={() => {
          setEditingClient(null);
          setIsModalOpen(false);
        }}
        onSubmit={handleSaveClient}
      />
    </div>
  );
}
