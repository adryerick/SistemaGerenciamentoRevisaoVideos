import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-[#29292d] bg-[#111113] p-5">

      {/* Logo */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2b2b2d] font-bold">
          R
        </div>

        <div>
          <h1 className="font-semibold text-white">
            VideoReview
          </h1>

          <p className="text-xs text-zinc-500">
            Gestão de revisão
          </p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="space-y-2">

        <Link
          href="/dashboard"
          className="block rounded-lg bg-[#1d1d21] px-3 py-2.5 text-sm text-white transition hover:bg-[#242428]"
        >
          Dashboard
        </Link>

        <Link
          href="/projetos"
          className="block rounded-lg px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-[#1d1d21] hover:text-white"
        >
          Projetos
        </Link>

        <Link
          href="/clientes"
          className="block rounded-lg px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-[#1d1d21] hover:text-white"
        >
          Clientes
        </Link>

      </nav>

      {/* Usuário */}
      <div className="absolute bottom-5 w-[214px] rounded-xl border border-[#29292d] bg-[#171719] p-3">
        <p className="text-sm font-medium text-white">
          Adryerick
        </p>

        <p className="text-xs text-zinc-500">
          Editor de Vídeo
        </p>
      </div>

    </aside>
  );
}