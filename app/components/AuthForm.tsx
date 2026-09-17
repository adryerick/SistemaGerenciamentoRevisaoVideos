"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({ setup = false, token = "" }: { setup?: boolean; token?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    if (setup && form.get("password") !== form.get("confirmPassword")) { setError("As senhas não conferem."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(setup ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), token: form.get("token") }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error ?? "Não foi possível entrar. Tente novamente."); return; }
      router.replace("/dashboard"); router.refresh();
    } catch { setError("Falha de conexão. Verifique se o servidor está em execução."); }
    finally { setBusy(false); }
  }
  const inputClass = "mt-2 w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-white outline-none focus:border-zinc-500";
  return <main className="flex min-h-screen items-center justify-center bg-[#0d0d0f] px-5 py-10 text-white">
    <div className="w-full max-w-md">
      <h1 className="mb-7 text-lg font-semibold">VideoReview <span className="ml-2 text-xs font-normal text-zinc-500">Gestão de revisão</span></h1>
      <form onSubmit={submit} className="rounded-2xl border border-[#29292d] bg-[#151517] p-7">
        <h2 className="text-2xl font-semibold">{setup ? "Configurar seu acesso" : "Entrar no painel"}</h2>
        <p className="mb-6 mt-2 text-sm leading-6 text-zinc-400">{setup ? "Crie a conta do editor. Seus clientes, projetos e vídeos existentes serão preservados." : "Acesse sua conta para gerenciar projetos e revisões."}</p>
        <fieldset disabled={busy} className="space-y-4">
          {setup && <>
            <label className="block text-sm text-zinc-300">Código de configuração
              <input name="token" required defaultValue={token} autoComplete="off" className={inputClass} />
            </label>
            <p className="text-xs text-zinc-500">O código é gerado no computador do projeto com npm run auth:prepare. Não compartilhe esse código.</p>
            <label className="block text-sm text-zinc-300">Seu nome<input name="name" required minLength={2} maxLength={100} autoComplete="name" className={inputClass} /></label>
          </>}
          <label className="block text-sm text-zinc-300">E-mail<input name="email" type="email" required maxLength={254} autoComplete="username" className={inputClass} /></label>
          <label className="block text-sm text-zinc-300">Senha<input name="password" type="password" required minLength={setup ? 12 : undefined} maxLength={128} autoComplete={setup ? "new-password" : "current-password"} className={inputClass} /></label>
          {setup && <>
            <p className="text-xs text-zinc-400">Use uma senha ou frase-senha de pelo menos 12 caracteres.</p>
            <label className="block text-sm text-zinc-300">Confirmar senha<input name="confirmPassword" type="password" required autoComplete="new-password" className={inputClass} /></label>
          </>}
          <button className="w-full rounded-lg bg-white py-3 font-medium text-black hover:bg-zinc-200 disabled:opacity-50">{busy ? "Aguarde..." : setup ? "Criar meu acesso" : "Entrar"}</button>
        </fieldset>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        <Link href={setup ? "/" : "/configurar"} className="mt-5 block text-center text-xs text-zinc-400 underline">{setup ? "Já configurei minha conta" : "Primeiro acesso neste computador"}</Link>
      </form>
    </div>
  </main>;
}
