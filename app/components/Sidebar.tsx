"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const navigationItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/projetos", label: "Projetos" },
    { href: "/clientes", label: "Clientes" },
  ];

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
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-[#1d1d21] text-white hover:bg-[#242428]"
                  : "text-zinc-500 hover:bg-[#1d1d21] hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
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
