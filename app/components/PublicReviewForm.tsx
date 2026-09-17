"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ChangeRequest, VideoVersion } from "../types";
import { formatTimestamp, parseTimestamp, validateReviewInput } from "../lib/review-feedback";
import { seekToTimestamp } from "../lib/video-navigation";
import VideoPlayer from "./VideoPlayer";

type PublicReviewFormProps = {
  reviewToken: string;
  videoVersions: VideoVersion[];
  changeRequests: ChangeRequest[];
};

export default function PublicReviewForm({ reviewToken, videoVersions, changeRequests }: PublicReviewFormProps) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [videoVersionId, setVideoVersionId] = useState(videoVersions[0]?.id ?? 0);
  const selected = videoVersions.find((version) => version.id === videoVersionId) ?? videoVersions[0];
  const [comment, setComment] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const requests = changeRequests.filter((request) => request.videoVersionId === selected?.id);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSuccess(false);
    setError("");
    const input = validateReviewInput({ videoVersionId: selected?.id, comment, timestamp });
    if ("error" in input) { setError(input.error); return; }
    setSending(true);
    try {
      const response = await fetch(`/api/revisao/${reviewToken}/solicitacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error ?? "Não foi possível enviar a solicitação."); return; }
      setComment("");
      setTimestamp("");
      setSuccess(true);
      refresh();
    } catch {
      setError("Não foi possível enviar a solicitação. Seu texto foi mantido; tente novamente.");
    } finally { setSending(false); }
  }

  if (!selected) return <p className="rounded-xl border border-dashed border-[#303035] p-8 text-sm text-zinc-400">Ainda não há uma versão de vídeo disponível para revisão.</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
        <h2 className="text-lg font-semibold">Revisar vídeo</h2>
        <label htmlFor="review-version" className="mt-4 block text-sm text-zinc-400">Versão em revisão</label>
        <select id="review-version" value={selected.id} disabled={sending}
          onChange={(event) => { setVideoVersionId(Number(event.target.value)); setTimestamp(""); setSuccess(false); setError(""); }}
          className="mt-2 w-full rounded-lg border border-[#303035] bg-[#111113] p-3 text-sm">
          {videoVersions.map((version, index) => <option key={version.id} value={version.id}>V{String(version.number).padStart(2, "0")} · {version.fileName}{index === 0 ? " (mais recente)" : ""}</option>)}
        </select>
        <p className="mt-2 text-xs text-zinc-400">Enviada em {selected.sentAt}. Os comentários abaixo pertencem a esta versão.</p>
        {selected.videoUrl ? <VideoPlayer key={selected.id} videoRef={(element) => { videoRef.current = element; }}
          src={`/api/revisao/${reviewToken}/videos/${selected.id}`}
          onMarkTime={sending ? undefined : (seconds) => {
            setTimestamp(formatTimestamp(seconds));
            commentRef.current?.focus();
            commentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }} /> : <p className="mt-4 text-sm text-zinc-400">Arquivo de vídeo ainda não enviado.</p>}
      </section>

      <form onSubmit={submitFeedback} className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
        <h2 className="text-lg font-semibold">Enviar solicitação de ajuste</h2>
        <p className="mt-1 text-sm text-zinc-400">Use “Comentar neste instante” no vídeo ou preencha a minutagem manualmente.</p>
        <fieldset disabled={sending} className="mt-5 space-y-3">
          <label className="block text-sm text-zinc-300">Minutagem (opcional)
            <input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} maxLength={8}
              placeholder="00:23 ou 01:02:03" className="mt-2 w-full rounded-lg border border-[#303035] bg-[#111113] p-3 text-sm" />
          </label>
          <label className="block text-sm text-zinc-300">O que precisa mudar?
            <textarea ref={commentRef} required value={comment} onChange={(event) => setComment(event.target.value)} rows={4} maxLength={2000}
              placeholder="Descreva o ajuste desejado..." className="mt-2 w-full resize-y rounded-lg border border-[#303035] bg-[#111113] p-3 text-sm" />
          </label>
          <p className="text-xs text-zinc-500">{comment.length}/2.000 caracteres</p>
          <button className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-50">{sending ? "Enviando..." : "Enviar solicitação"}</button>
        </fieldset>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        {success && <p role="status" className="mt-4 text-sm text-emerald-300">Solicitação enviada. Obrigado pelo feedback!</p>}
      </form>

      <section className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Solicitações desta versão ({requests.length})</h2>
          <button type="button" onClick={refresh} disabled={refreshing || sending} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm disabled:opacity-50">{refreshing ? "Atualizando..." : "Atualizar status"}</button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">Visível para quem possui este link de revisão.</p>
        <div className="mt-4 space-y-3">
          {requests.map((request) => <article key={request.id} className="rounded-lg border border-[#303035] bg-[#111113] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {selected.videoUrl && request.timestamp && parseTimestamp(request.timestamp) !== null
                ? <button type="button" onClick={() => seekToTimestamp(videoRef.current, request.timestamp!)} className="rounded border border-zinc-600 px-2 py-1 text-zinc-200" aria-label={`Ir para ${request.timestamp} no vídeo`}>▶ {request.timestamp}</button>
                : <span className="text-zinc-400">{request.timestamp || "Sem minutagem"}</span>}
              <span className={request.status === "Resolvido" ? "text-emerald-300" : "text-amber-200"}>{request.status}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-200">{request.comment}</p>
            <p className="mt-2 text-xs text-zinc-500">Registrada em {request.createdAt}</p>
          </article>)}
          {!requests.length && <p className="py-4 text-sm text-zinc-400">Nenhuma solicitação nesta versão.</p>}
        </div>
      </section>
    </div>
  );
}
