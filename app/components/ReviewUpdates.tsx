"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
type Activity = { signature: string; pending?: number; online?: boolean; lastBackupAt?: string; backupError?: string };

export default function ReviewUpdates({ endpoint = "/api/atividade", editor = false }: { endpoint?: string; editor?: boolean }) {
  const router = useRouter();
  const [updated, setUpdated] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    let signature: string | undefined;
    let loading = false;
    async function check() {
      if (document.hidden || loading) return;
      loading = true;
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: abort.signal });
        if (!response.ok) { setError(response.status === 401 && editor ? "Sua sessão expirou. Entre novamente para continuar." : response.status === 404 ? "Link desativado. Atualize a página." : "Atualização automática indisponível. Tente atualizar a página."); return; }
        const result: Activity = await response.json();
        if (signature && signature !== result.signature) setUpdated(true);
        signature = result.signature; setActivity(result); setError("");
      } catch { if (!abort.signal.aborted) setError("Sem conexão para consultar atualizações."); }
      finally { loading = false; }
    }
    void check();
    const interval = setInterval(() => void check(), 15000);
    document.addEventListener("visibilitychange", check);
    return () => { abort.abort(); clearInterval(interval); document.removeEventListener("visibilitychange", check); };
  }, [endpoint, editor, revision]);
  return <div className="space-y-2 text-xs text-zinc-400">
    {editor && <p>{activity?.pending ?? "—"} ajustes em aberto</p>}
    {updated && <div role="status" className="rounded-lg border border-amber-600 p-3 text-amber-100"><p>Há novidades em vídeos, conversas ou status.</p><button type="button" onClick={() => { router.refresh(); setUpdated(false); setRevision((value) => value + 1); }} className="mt-2 underline">Ver atualizações</button></div>}
    {editor && activity && <p>{activity.online ? "Processador online" : "Processador offline"}{activity.lastBackupAt ? ` · Backup: ${new Date(activity.lastBackupAt).toLocaleString("pt-BR")}` : " · Backup ainda não confirmado"}</p>}
    {editor && activity?.backupError && <p role="alert" className="text-amber-200">{activity.backupError}</p>}
    {error && <p role="alert">{error}{editor && error.startsWith("Sua sessão expirou") && <Link href="/" prefetch={false} className="ml-2 text-zinc-200 underline">Entrar novamente</Link>}</p>}
  </div>;
}
