"use client";

import { useState } from "react";
import type { Client } from "../types";

type NewClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (client: Client) => void;
};

export default function NewClientModal({
  isOpen,
  onClose,
  onCreate,
}: NewClientModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  if (!isOpen) {
    return null;
  }

  function handleCreate() {
    if (!name.trim() || !email.trim()) {
      return;
    }

    const newClient: Client = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      projects: 0,
      status: "Ativo",
    };

    onCreate(newClient);

    setName("");
    setEmail("");
  }

  function handleClose() {
    setName("");
    setEmail("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#29292d] bg-[#151517] p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Novo cliente</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Cadastre um novo cliente no sistema.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Nome
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do cliente"
              className="w-full rounded-lg border border-[#303035] bg-[#111113] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#55555c]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cliente@email.com"
              className="w-full rounded-lg border border-[#303035] bg-[#111113] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#55555c]"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-lg border border-[#303035] px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-[#1d1d21] hover:text-white"
          >
            Cancelar
          </button>

          <button
            onClick={handleCreate}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Criar cliente
          </button>
        </div>
      </div>
    </div>
  );
}