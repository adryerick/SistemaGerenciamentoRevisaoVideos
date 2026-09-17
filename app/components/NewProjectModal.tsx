"use client";

import { useState } from "react";
import type { Client } from "../types";
import { readNewProjectForm, type NewProjectInput } from "../lib/project-input";

type NewProjectModalProps = {
  isOpen: boolean;
  clients: Client[];
  onClose: () => void;
  onCreate: (project: NewProjectInput) => Promise<void>;
};

export default function NewProjectModal({
  isOpen,
  clients,
  onClose,
  onCreate,
}: NewProjectModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const input = readNewProjectForm(new FormData(event.currentTarget));
    if (!input.name || !clients.some((client) => client.id === input.clientId)) {
      setError("Informe o nome do projeto e selecione um cliente cadastrado."); return;
    }
    setSaving(true); setError("");
    try { await onCreate(input); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : "Não foi possível criar o projeto."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <form onSubmit={handleCreate} role="dialog" aria-modal="true" aria-labelledby="new-project-title" className="w-full max-w-lg rounded-2xl border border-[#29292d] bg-[#151517] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 id="new-project-title" className="text-lg font-semibold">Novo projeto</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Cadastre um novo projeto para iniciar a revisão.
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleClose}
            className="text-xl text-zinc-500 hover:text-white"
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>

        <fieldset disabled={saving} className="space-y-5">
          <div>
            <label htmlFor="project-name" className="mb-2 block text-sm text-zinc-400">
              Nome do projeto
            </label>

            <input
              id="project-name" name="name" required maxLength={120}
              placeholder="Ex.: VSL — Produto X"
              className="w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </div>

          <div>
            <label htmlFor="project-client" className="mb-2 block text-sm text-zinc-400">Cliente</label>

            <select
              id="project-client" name="clientId" required defaultValue={clients[0]?.id ?? ""}
              className="w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-sm text-zinc-300 outline-none focus:border-zinc-500"
            >
              {!clients.length && <option value="">Cadastre um cliente primeiro</option>}
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} — {client.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="project-description" className="mb-2 block text-sm text-zinc-400">Descrição</label>

            <textarea
              id="project-description" name="description" maxLength={2000}
              placeholder="Descreva brevemente o projeto..."
              rows={4}
              className="w-full resize-none rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </div>
        </fieldset>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        {!clients.length && <p className="mt-4 text-sm text-zinc-400">Cadastre um cliente na aba Clientes antes de criar o projeto.</p>}
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button" disabled={saving}
            onClick={handleClose}
            className="rounded-lg border border-[#303035] bg-[#1b1b1e] px-4 py-2.5 text-sm text-zinc-300 hover:bg-[#232328]"
          >
            Cancelar
          </button>

          <button
            type="submit" disabled={saving || !clients.length}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200"
          >
            {saving ? "Criando..." : "Criar projeto"}
          </button>
        </div>
      </form>
    </div>
  );
}
