"use client";

import { useRef, useState } from "react";
import type { Client } from "../types";

type NewClientModalProps = {
  isOpen: boolean;
  client?: Client | null;
  onClose: () => void;
  onSubmit: (client: Pick<Client, "name" | "email">) => Promise<void>;
};

export default function NewClientModal({
  isOpen,
  client,
  onClose,
  onSubmit,
}: NewClientModalProps) {
  const [name, setName] = useState(client?.name ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  if (!isOpen) {
    return null;
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (!name.trim() || !email.trim()) {
      setError("Informe o nome e o e-mail do cliente.");
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      await onSubmit({ name: name.trim(), email: email.trim() });
      setName("");
      setEmail("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível salvar. Seus dados foram mantidos; tente novamente.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  function handleClose() {
    if (submitting.current) return;
    setName("");
    setEmail("");
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <form onSubmit={handleCreate} role="dialog" aria-modal="true" aria-labelledby="client-modal-title" aria-busy={saving} className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-[#29292d] bg-[#151517] p-6">
        <div className="mb-6">
          <h2 id="client-modal-title" className="text-lg font-semibold">
            {client ? "Editar cliente" : "Novo cliente"}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {client ? "Atualize os dados do cliente." : "Cadastre um novo cliente no sistema."}
          </p>
        </div>

        <fieldset disabled={saving} className="space-y-4">
          <div>
            <label htmlFor="client-name" className="mb-2 block text-sm text-zinc-400">
              Nome
            </label>

            <input
              type="text"
              id="client-name" name="name" required maxLength={120} autoComplete="name" autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do cliente"
              className="w-full rounded-lg border border-[#303035] bg-[#111113] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#55555c]"
            />
          </div>

          <div>
            <label htmlFor="client-email" className="mb-2 block text-sm text-zinc-400">
              E-mail
            </label>

            <input
              type="email"
              id="client-email" name="email" required maxLength={254} autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cliente@email.com"
              className="w-full rounded-lg border border-[#303035] bg-[#111113] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#55555c]"
            />
          </div>
        </fieldset>

        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button" disabled={saving}
            onClick={handleClose}
            className="rounded-lg border border-[#303035] px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-[#1d1d21] hover:text-white"
          >
            Cancelar
          </button>

          <button
            type="submit" disabled={saving}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Salvando..." : client ? "Salvar alterações" : "Criar cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
