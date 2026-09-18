"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ReviewUpdates from "./ReviewUpdates";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setLeaving(true); setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout");
      router.replace("/");
      router.refresh();
    } catch { setError("Não foi possível sair. Tente novamente."); setLeaving(false); }
  }
  const navigationItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/projetos", label: "Projetos" },
    { href: "/clientes", label: "Clientes" },
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#29292d] bg-[#111113] p-4 sm:w-64 sm:border-r sm:border-b-0 sm:p-5">

      {/* Logo */}
      <div className="mb-4 flex items-center gap-3 sm:mb-10">
        <div aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200 sm:h-10 sm:w-10">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M9 6.5v11l9-5.5-9-5.5Z" fill="currentColor" /><path d="M5 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </div>

        <div>
          <h1 className="font-semibold text-white">
            VideoReview
          </h1>

          <p className="hidden text-xs text-zinc-500 sm:block">
            Gestão de revisão
          </p>
        </div>
        <button type="button" disabled={leaving} onClick={logout} className="ml-auto min-h-8 px-2 text-xs text-zinc-300 underline disabled:opacity-50 sm:hidden">{leaving ? "Saindo..." : "Sair"}</button>
      </div>
      {error && <p role="alert" className="mb-3 text-xs text-red-300 sm:hidden">{error}</p>}

      {/* Navegação */}
      <nav aria-label="Navegação do editor" className="flex gap-2 sm:block sm:space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`block min-w-0 flex-1 rounded-lg px-3 py-2.5 text-center text-sm transition sm:text-left ${
                isActive
                  ? "bg-emerald-300/10 text-emerald-200 ring-1 ring-inset ring-emerald-300/20 hover:bg-emerald-300/15"
                  : "text-zinc-500 hover:bg-[#1d1d21] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Usuário */}
      <div className="mt-3 sm:mt-6"><ReviewUpdates editor /></div>
      <div className="mt-auto hidden rounded-xl border border-[#29292d] bg-[#171719] p-3 sm:block">
        <p className="text-sm font-medium text-white">
          Área do editor
        </p>
        <button type="button" disabled={leaving} onClick={logout} className="mt-3 text-xs text-zinc-300 underline disabled:opacity-50">{leaving ? "Saindo..." : "Sair da conta"}</button>
        {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}

        <p className="text-xs text-zinc-500">
          Editor de Vídeo
        </p>
      </div>

    </aside>
  );
}
