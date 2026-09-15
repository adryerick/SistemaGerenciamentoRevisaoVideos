"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-[#0d0d0f] flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2b2b2d] flex items-center justify-center text-white font-bold">
              R
            </div>

            <div>
              <h1 className="text-white font-semibold text-lg">
                VideoReview
              </h1>

              <p className="text-zinc-500 text-xs">
                Gestão de revisão
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#151517] border border-[#29292d] rounded-2xl p-7">

          <h2 className="text-white text-2xl font-semibold mb-2">
            Entrar no painel
          </h2>

          <p className="text-zinc-500 text-sm leading-6 mb-7">
            Acesse o sistema para gerenciar seus projetos e revisões.
          </p>

          <div className="space-y-4">

            <div>
              <label className="text-zinc-400 text-sm block mb-2">
                E-mail
              </label>

              <input
                type="email"
                placeholder="seuemail@email.com"
                className="w-full bg-[#101012] border border-[#2c2c30] rounded-lg px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-2">
                Senha
              </label>

              <input
                type="password"
                placeholder="Sua senha"
                className="w-full bg-[#101012] border border-[#2c2c30] rounded-lg px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
              />
            </div>

            <button
             onClick={() => router.push("/dashboard")}
             className="w-full bg-white text-black font-medium rounded-lg py-3 mt-2 hover:bg-zinc-200 transition"
            >
            Entrar
            </button>

          </div>

          <p className="text-zinc-600 text-xs text-center mt-6">
            Sistema de Gerenciamento de Revisão de Vídeos
          </p>

        </div>

      </div>
    </main>
  );
}