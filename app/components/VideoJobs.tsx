"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type Job = { id: string; fileName: string; status: string; error?: string; versionId?: number; attempts: number };

export default function VideoJobs({ projectId }: { projectId: number }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    let previous: string | undefined;
    let loading = false;
    async function load() {
      if (document.hidden || loading) return;
      loading = true;
      try {
        const response = await fetch(`/api/projetos/${projectId}/processamentos`, { cache: "no-store", signal: abort.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Não foi possível consultar o preparo.");
        const signature = JSON.stringify(result.jobs);
        if (previous && previous !== signature) router.refresh();
        previous = signature; setJobs(result.jobs); setOnline(result.online); setError("");
      } catch (failure) { if (!abort.signal.aborted) setError(failure instanceof Error ? failure.message : "Falha de conexão ao consultar o preparo."); }
      finally { loading = false; }
    }
    void load();
    const timer = setInterval(() => void load(), 5000);
    document.addEventListener("visibilitychange", load);
    return () => { clearInterval(timer); abort.abort(); document.removeEventListener("visibilitychange", load); };
  }, [projectId, router, revision]);
  async function act(job: Job, method: "PATCH" | "DELETE") {
    if (busy || (method === "DELETE" && !window.confirm("Descartar este envio com falha e apagar o arquivo recebido? Seu original no computador não será alterado."))) return;
    setBusy(job.id); setError("");
    try {
      const response = await fetch(`/api/projetos/${projectId}/processamentos`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: job.id }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error ?? "Não foi possível atualizar o preparo."); return; }
      setRevision((value) => value + 1);
    } catch { setError("Falha de conexão. Atualize o andamento antes de tentar novamente."); }
    finally { setBusy(""); }
  }
  return <div className="rounded-lg border border-zinc-700 p-4">
    <p className="text-sm font-medium">Preparos em segundo plano</p>
    {!online && <p className="mt-2 text-xs text-amber-200">Processador offline. No servidor, execute npm run worker. A fila será retomada quando ele voltar.</p>}
    <ul className="mt-3 space-y-3">{jobs.map((job) => <li key={job.id} className="break-words text-xs text-zinc-300"><strong>{job.fileName}</strong> · {job.status}{job.status === "Pronto" && job.versionId && <a href={`#version-${job.versionId}`} className="ml-2 text-emerald-300 underline">Ver versão</a>}{job.error && <p className="mt-1 text-red-300">{job.error}</p>}{job.status === "Falhou" && <div className="mt-2 flex gap-3"><button type="button" disabled={!!busy || !online || job.attempts >= 3} onClick={() => act(job, "PATCH")} className="underline disabled:opacity-40">Tentar novamente</button><button type="button" disabled={!!busy} onClick={() => act(job, "DELETE")} className="text-red-300 underline">Descartar envio</button></div>}</li>)}</ul>
    {!jobs.length && <p className="mt-2 text-xs text-zinc-500">Nenhum preparo recente.</p>}
    {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
  </div>;
}
