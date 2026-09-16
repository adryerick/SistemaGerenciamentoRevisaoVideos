"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ClientTable from "../components/ClientTable";
import NewClientModal from "../components/NewClientModal";
import { mockClients } from "../lib/mock-data";
import type { Client } from "../types";

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadClients() {
      const response = await fetch("/api/clients");

      if (response.ok) {
        setClients(await response.json());
      }
    }

    void loadClients();
  }, []);

  async function handleCreateClient(client: Client) {
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: client.name, email: client.email }),
      });
      const result = await response.json();

      if (!response.ok) {
        alert(result.error ?? "Não foi possível criar o cliente.");
        return;
      }

      setClients((currentClients) => [result, ...currentClients]);
      setIsModalOpen(false);
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
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              + Novo cliente
            </button>
          </div>

          <ClientTable clients={clients} />
        </div>
      </main>

      <NewClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateClient}
      />
    </div>
  );
}
