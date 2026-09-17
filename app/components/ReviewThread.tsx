"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ChangeRequest } from "../types";

export default function ReviewThread({ request, reviewToken, authorName }: { request: ChangeRequest; reviewToken?: string; authorName?: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  async function reply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !comment.trim()) return;
    setBusy(true); setError(""); setSent(false);
    try {
      const endpoint = reviewToken ? `/api/revisao/${reviewToken}/solicitacoes/${request.id}/respostas` : `/api/solicitacoes/${request.id}/respostas`;
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment, authorName }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error ?? "Não foi possível responder. Seu texto foi mantido."); return; }
      setComment(""); setSent(true); router.refresh();
    } catch { setError("Falha de conexão. Sua resposta foi mantida; tente novamente."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 border-t border-zinc-800 pt-4">
    <p className="text-xs font-medium text-zinc-400">Conversa ({request.replies?.length ?? 0})</p>
    <div className="mt-3 space-y-3">
      {request.replies?.map((reply) => <div key={reply.id} className={`rounded-lg border-l-2 p-3 ${reply.role === "Editor" ? "border-sky-400 bg-sky-950/20" : "border-zinc-500 bg-zinc-900"}`}>
        <p className="text-xs text-zinc-400">{reply.role}{reply.authorName ? ` · ${reply.authorName}` : ""} · {reply.createdAt}</p>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-zinc-200">{reply.comment}</p>
      </div>)}
    </div>
    <form onSubmit={reply} className="mt-3 space-y-2">
      <textarea aria-label={`Resposta à solicitação ${request.id}`} placeholder={reviewToken ? "Responder ao editor..." : "Responder ao cliente..."}
        value={comment} disabled={busy} maxLength={2000} required rows={2} onChange={(event) => { setComment(event.target.value); setSent(false); }}
        className="w-full resize-y rounded-lg border border-zinc-700 bg-[#151517] p-3 text-sm" />
      <button disabled={busy || !comment.trim()} className="rounded-lg border border-zinc-600 px-3 py-2 text-xs disabled:opacity-40">{busy ? "Enviando..." : "Enviar resposta"}</button>
    </form>
    {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    {sent && <p role="status" className="mt-2 text-xs text-emerald-300">Resposta enviada.</p>}
  </div>;
}
