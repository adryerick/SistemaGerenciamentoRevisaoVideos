"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "../types";

export default function EditProjectPanel({ project }: { project: Project }) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState(project.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch(`/api/projetos/${project.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error ?? "Não foi possível salvar o projeto."); return; }
      setSaved(true); router.refresh();
    } catch { setError("Falha de conexão. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <details className="mt-6 rounded-xl border border-[#29292d] bg-[#151517] p-5">
    <summary className="cursor-pointer text-sm font-medium">Editar nome, descrição e status do projeto</summary>
    <form onSubmit={save} className="mt-4">
      <fieldset disabled={busy} className="space-y-3">
        <label className="block text-sm text-zinc-300">Nome
          <input required maxLength={120} value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#111113] p-2.5" />
        </label>
        <label className="block text-sm text-zinc-300">Descrição
          <textarea maxLength={2000} rows={3} value={description} onChange={(event) => { setDescription(event.target.value); setSaved(false); }} className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#111113] p-2.5" />
        </label>
        <label className="block text-sm text-zinc-300">Status do projeto
          <select value={status} onChange={(event) => { setStatus(event.target.value); setSaved(false); }} className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#111113] p-2.5">
            {["Pendente", "Em revisão", "Aguardando cliente", "Resolvido"].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <p className="text-xs text-zinc-400">Alterar o status do projeto não resolve automaticamente as solicitações.</p>
        <button className="rounded-lg bg-white px-4 py-2 text-sm text-black disabled:opacity-50">{busy ? "Salvando..." : "Salvar projeto"}</button>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {saved && <p role="status" className="mt-3 text-sm text-emerald-300">Projeto atualizado.</p>}
    </form>
  </details>;
}
