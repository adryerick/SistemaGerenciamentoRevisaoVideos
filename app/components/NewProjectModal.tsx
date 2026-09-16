"use client";

import { useState } from "react";
import type { Client, Project } from "../types";

type NewProjectModalProps = {
  isOpen: boolean;
  clients: Client[];
  onClose: () => void;
  onCreate: (project: Omit<Project, "id">) => void;
};

export default function NewProjectModal({
  isOpen,
  clients,
  onClose,
  onCreate,
}: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [client, setClient] = useState(clients[0]?.name ?? "");
  const [description, setDescription] = useState("");

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    setName("");
    setClient(clients[0]?.name ?? "");
    setDescription("");
    onClose();
  }

  function handleCreate() {
    if (!name.trim()) {
      alert("Informe o nome do projeto.");
      return;
    }

    onCreate({
      name: name.trim(),
      client,
      version: "01",
      status: "Pendente",
      requests: 0,
      progress: 0,
      description: description.trim(),
    });

    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#29292d] bg-[#151517] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Novo projeto</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Cadastre um novo projeto para iniciar a revisão.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="text-xl text-zinc-500 hover:text-white"
            aria-label="Fechar modal"
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
            <label className="mb-2 block text-sm text-zinc-400">Cliente</label>

            <select
              value={client}
              onChange={(event) => setClient(event.target.value)}
              className="w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-zinc-500"
            >
              {clients.map((mockClient) => (
                <option key={mockClient.id} value={mockClient.name}>
                  {mockClient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">Descrição</label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva brevemente o projeto..."
              rows={4}
              className="w-full resize-none rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-lg border border-[#303035] bg-[#1b1b1e] px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#232328]"
          >
            Cancelar
          </button>

          <button
            onClick={handleCreate}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200"
          >
            Criar projeto
          </button>
        </div>
      </div>
    </div>
  );
}
