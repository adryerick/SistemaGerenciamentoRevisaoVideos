"use client";

import { useState } from "react";
import Sidebar from "../components/Sidebar";

type Client = {
  name: string;
  email: string;
  projects: number;
  status: string;
};

const initialClients: Client[] = [
  {
    name: "Cliente Demo",
    email: "cliente@demo.com",
    projects: 3,
    status: "Ativo",
  },
  {
    name: "Studio X",
    email: "contato@studiox.com",
    projects: 2,
    status: "Ativo",
  },
  {
    name: "Marca Alpha",
    email: "marketing@alpha.com",
    projects: 4,
    status: "Concluído",
  },
];

export default function Clients() {
  const [clients, setClients] = useState<Client[]>(initialClients);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function createClient() {
    if (!name.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }

    if (!email.trim()) {
      alert("Informe o e-mail do cliente.");
      return;
    }

    const newClient: Client = {
      name: name.trim(),
      email: email.trim(),
      projects: 0,
      status: "Ativo",
    };

    setClients((currentClients) => [
      newClient,
      ...currentClients,
    ]);

    setName("");
    setEmail("");
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
                Clientes
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Cadastre e consulte seus clientes.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              + Novo cliente
            </button>

          </div>

          {/* BUSCA */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar cliente..."
              className="w-80 rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </div>

          {/* TABELA */}
          <div className="overflow-hidden rounded-xl border border-[#29292d] bg-[#151517]">

            <div className="grid grid-cols-5 border-b border-[#29292d] px-5 py-3 text-[11px] uppercase tracking-wide text-zinc-600">
              <span>Cliente</span>
              <span>E-mail</span>
              <span>Projetos</span>
              <span>Status</span>
              <span>Ação</span>
            </div>

            {clients.map((client) => (
              <div
                key={client.email}
                className="grid grid-cols-5 items-center border-b border-[#29292d] px-5 py-4 text-sm last:border-b-0"
              >

                <div>
                  <p className="font-medium">
                    {client.name}
                  </p>
                </div>

                <span className="text-zinc-500">
                  {client.email}
                </span>

                <span className="text-zinc-400">
                  {client.projects}
                </span>

                <span>
                  <span className="rounded-full bg-[#242a26] px-2.5 py-1 text-[11px] text-[#9bb0a2]">
                    {client.status}
                  </span>
                </span>

                <button className="w-fit rounded-lg border border-[#303035] bg-[#1b1b1e] px-3 py-2 text-xs text-zinc-300 transition hover:bg-[#232328]">
                  Ver projetos
                </button>

              </div>
            ))}

          </div>

          {/* MODAL */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

              <div className="w-full max-w-md rounded-2xl border border-[#29292d] bg-[#151517] p-6 shadow-2xl">

                <div className="mb-6 flex items-center justify-between">

                  <div>
                    <h3 className="text-lg font-semibold">
                      Novo cliente
                    </h3>

                    <p className="mt-1 text-xs text-zinc-500">
                      Cadastre um cliente para utilizar nos projetos.
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
                      Nome
                    </label>

                    <input
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder="Nome do cliente"
                      className="w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">
                      E-mail
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="cliente@email.com"
                      className="w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
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
                    onClick={createClient}
                    className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200"
                  >
                    Cadastrar cliente
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