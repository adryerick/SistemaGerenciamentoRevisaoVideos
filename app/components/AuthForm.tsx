"use client";

import Link from "next/link";
import { useState } from "react";

export default function AuthForm({ setup = false, recovery = false, token = "", email = "" }: { setup?: boolean; recovery?: boolean; token?: string; email?: string }) {
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    if ((setup || recovery) && form.get("password") !== form.get("confirmPassword")) { setError("As senhas não conferem."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(recovery ? "/api/auth/recover" : setup ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), confirmPassword: form.get("confirmPassword"), token: form.get("token") }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error ?? "Não foi possível entrar. Tente novamente."); return; }
      const session = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
      if (!session.ok) {
        setError("O acesso foi aceito, mas o navegador não manteve a sessão. Permita cookies para este site no Opera e tente novamente.");
        return;
      }
      window.location.replace("/dashboard");
    } catch { setError("Falha de conexão. Verifique se o servidor está em execução."); }
    finally { setBusy(false); }
  }
  const inputClass = "mt-2 w-full rounded-lg border border-[#2c2c30] bg-[#101012] px-4 py-3 text-white outline-none focus:border-zinc-500";
  return <main className="flex min-h-screen items-center justify-center bg-[#0d0d0f] px-5 py-10 text-white">
    <div className="w-full max-w-md">
      <h1 className="mb-7 text-lg font-semibold">VideoReview <span className="ml-2 text-xs font-normal text-zinc-500">Gestão de revisão</span></h1>
      <form onSubmit={submit} className="rounded-2xl border border-[#29292d] bg-[#151517] p-7">
        <h2 className="text-2xl font-semibold">{recovery ? "Recuperar meu acesso" : setup ? "Configurar seu acesso" : "Entrar no painel"}</h2>
        <p className="mb-6 mt-2 text-sm leading-6 text-zinc-400">{recovery ? "Confira seu e-mail e escolha uma nova senha. Seus dados serão preservados e as sessões anteriores serão encerradas." : setup ? "Crie a conta do editor. Seus clientes, projetos e vídeos existentes serão preservados." : "Acesse sua conta para gerenciar projetos e revisões."}</p>
        <fieldset disabled={busy} className="space-y-4">
          {recovery && <label className="block text-sm text-zinc-300">Código de recuperação
            <input name="token" required defaultValue={token} autoComplete="off" className={inputClass} />
            <span className="mt-2 block text-xs text-zinc-400">Gere o link no computador do projeto com npm run auth:recover. Ele vale por 30 minutos e só pode ser usado uma vez.</span>
          </label>}
          {setup && <>
            <label className="block text-sm text-zinc-300">Código de configuração
              <input name="token" required defaultValue={token} autoComplete="off" className={inputClass} />
            </label>
            <p className="text-xs text-zinc-500">O código é gerado no computador do projeto com npm run auth:prepare. Não compartilhe esse código.</p>
            <label className="block text-sm text-zinc-300">Seu nome<input name="name" required minLength={2} maxLength={100} autoComplete="name" className={inputClass} /></label>
          </>}
          <label className="block text-sm text-zinc-300">E-mail<input id="login-email" name="email" type="email" required defaultValue={email} maxLength={254} autoComplete="username" autoCapitalize="none" spellCheck={false} className={inputClass} /></label>
          <label className="block text-sm text-zinc-300">Senha<input id="login-password" name="password" type={showPassword ? "text" : "password"} required minLength={setup || recovery ? 12 : undefined} maxLength={128} autoComplete={setup || recovery ? "new-password" : "current-password"} className={inputClass} /></label>
          <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)} className="text-xs text-zinc-300 underline">{showPassword ? "Ocultar senha" : "Mostrar senha"}</button>
          {(setup || recovery) && <>
            <p className="text-xs text-zinc-400">Use uma senha ou frase-senha de pelo menos 12 caracteres.</p>
            <label className="block text-sm text-zinc-300">Confirmar senha<input name="confirmPassword" type="password" required autoComplete="new-password" className={inputClass} /></label>
          </>}
          <button className="w-full rounded-lg bg-white py-3 font-medium text-black hover:bg-zinc-200 disabled:opacity-50">{busy ? "Aguarde..." : recovery ? "Salvar novo acesso" : setup ? "Criar meu acesso" : "Entrar"}</button>
        </fieldset>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        {error && !setup && !recovery && <p className="mt-2 text-xs leading-5 text-zinc-400">Confira o e-mail e use Mostrar senha para verificar o preenchimento automático. Se não lembrar do acesso, use a recuperação abaixo.</p>}
        {!setup && !recovery && <Link href="/recuperar" className="mt-5 block text-center text-xs text-zinc-300 underline">Esqueci meu acesso</Link>}
        <Link href={setup || recovery ? "/" : "/configurar"} className="mt-5 block text-center text-xs text-zinc-400 underline">{setup || recovery ? "Voltar para entrar" : "Primeiro acesso neste computador"}</Link>
      </form>
    </div>
  </main>;
}
