import type { Client } from "../types";

type ClientTableProps = {
  clients: Client[];
};

export default function ClientTable({ clients }: ClientTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#29292d] bg-[#151517]">
      <table className="w-full">
        <thead className="border-b border-[#29292d] bg-[#111113]">
          <tr>
            <th className="px-5 py-4 text-left text-xs font-medium text-zinc-500">
              Cliente
            </th>
            <th className="px-5 py-4 text-left text-xs font-medium text-zinc-500">
              E-mail
            </th>
            <th className="px-5 py-4 text-left text-xs font-medium text-zinc-500">
              Projetos
            </th>
            <th className="px-5 py-4 text-left text-xs font-medium text-zinc-500">
              Status
            </th>
            <th className="px-5 py-4 text-right text-xs font-medium text-zinc-500">
              Ação
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#29292d]">
          {clients.map((client) => (
            <tr key={client.id} className="transition hover:bg-[#1a1a1d]">
              <td className="px-5 py-4">
                <p className="text-sm font-medium text-white">
                  {client.name}
                </p>
              </td>

              <td className="px-5 py-4 text-sm text-zinc-500">
                {client.email}
              </td>

              <td className="px-5 py-4 text-sm text-zinc-400">
                {client.projects}
              </td>

              <td className="px-5 py-4">
                <span className="rounded-full bg-[#222225] px-2.5 py-1 text-[11px] text-zinc-300">
                  {client.status}
                </span>
              </td>

              <td className="px-5 py-4 text-right">
                <button className="rounded-lg border border-[#303035] bg-[#1b1b1e] px-3 py-2 text-xs text-zinc-300 transition hover:bg-[#232328]">
                  Visualizar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}