"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ChangeRequest, VideoVersion } from "../types";
import { formatTimestamp, parseTimestamp, validateReviewInput } from "../lib/review-feedback";
import { seekToTimestamp } from "../lib/video-navigation";
import VideoPlayer from "./VideoPlayer";
import { useReviewDraft } from "../lib/use-review-draft";
import ReviewThread from "./ReviewThread";
import VersionReviewStatus from "./VersionReviewStatus";
import VersionComparison from "./VersionComparison";
import ReviewUpdates from "./ReviewUpdates";

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
  const draft = useReviewDraft(reviewToken, selected?.id ?? 0);
  const { comment, timestamp } = draft;
  const [filter, setFilter] = useState("Todas");
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [decisionSuccess, setDecisionSuccess] = useState("");
  const [resumeTime, setResumeTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const requests = changeRequests.filter((request) => request.videoVersionId === selected?.id);
  const visibleRequests = requests.filter((request) => filter === "Todas" || request.status === filter);
  const resolvedCount = requests.filter((request) => request.status === "Resolvido").length;
  const pendingCount = requests.length - resolvedCount;

  async function approve() {
    if (!selected || sending) return;
    if (comment.trim()) { setDecisionError("Envie ou remova seu rascunho de ajuste antes de aprovar."); return; }
    if (!window.confirm(`Aprovar a versão V${String(selected.number).padStart(2, "0")}? A decisão será visível ao editor e a quem possui este link.`)) return;
    setSending(true); setDecisionError(""); setDecisionSuccess("");
    try {
      const response = await fetch(`/api/revisao/${reviewToken}/aprovacao`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoVersionId: selected.id, authorName }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setDecisionError(result.error ?? "Não foi possível aprovar. Tente novamente."); refresh(); return; }
      setDecisionSuccess("Aprovação registrada para esta versão. Obrigado!"); refresh();
    } catch { setDecisionError("Falha de conexão. A aprovação não foi confirmada; atualize antes de tentar novamente."); }
    finally { setSending(false); }
  }

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
        body: JSON.stringify({ ...input, authorName }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error ?? "Não foi possível enviar a solicitação."); return; }
      draft.clear();
      setSuccess(true);
      refresh();
    } catch {
      setError("Não foi possível enviar a solicitação. Seu texto foi mantido; tente novamente.");
    } finally { setSending(false); }
  }

  if (!selected) return <p className="rounded-xl border border-dashed border-[#303035] p-8 text-sm text-zinc-400">Ainda não há uma versão de vídeo disponível para revisão.</p>;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
      <div className="lg:col-span-2"><ReviewUpdates endpoint={`/api/revisao/${reviewToken}/atividade`} /></div>
      <section className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
        <h2 className="text-lg font-semibold">Revisar vídeo</h2>
        <label htmlFor="review-version" className="mt-4 block text-sm text-zinc-400">Versão em revisão</label>
        <select id="review-version" value={selected.id} disabled={sending}
          onChange={(event) => { setResumeTime(videoRef.current?.currentTime ?? 0); setVideoVersionId(Number(event.target.value)); setSuccess(false); setError(""); setDecisionError(""); setDecisionSuccess(""); }}
          className="mt-2 w-full rounded-lg border border-[#303035] bg-[#111113] p-3 text-sm">
          {videoVersions.map((version, index) => <option key={version.id} value={version.id}>V{String(version.number).padStart(2, "0")} · {version.fileName}{index === 0 ? " (mais recente)" : ""}</option>)}
        </select>
        <p className="mt-2 text-xs text-zinc-400">Enviada em {selected.sentAt}. Os comentários abaixo pertencem a esta versão.</p>
        <VersionReviewStatus version={selected} />
        {selected.videoUrl ? <VideoPlayer key={selected.id} videoRef={(element) => { videoRef.current = element; }}
          src={`/api/revisao/${reviewToken}/videos/${selected.id}`}
          requests={requests}
          initialTime={resumeTime}
          onMarkTime={sending ? undefined : (seconds) => {
            draft.update({ timestamp: formatTimestamp(seconds) });
            commentRef.current?.focus();
            commentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }} /> : <p className="mt-4 text-sm text-zinc-400">Arquivo de vídeo ainda não enviado.</p>}
        <div className="mt-5 border-t border-zinc-800 pt-4">
          <label className="block text-sm text-zinc-300">Seu nome (opcional)
            <input value={authorName} disabled={sending} maxLength={80} onChange={(event) => setAuthorName(event.target.value)} placeholder="Como o editor pode identificar você"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#111113] p-3 text-sm" />
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={approve} disabled={sending || refreshing || !selected.videoUrl || selected.id !== videoVersions[0]?.id || pendingCount > 0 || selected.reviewStatus === "Aprovado"}
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-black disabled:opacity-40">{selected.reviewStatus === "Aprovado" ? "Versão aprovada" : "Aprovar esta versão"}</button>
            <button type="button" disabled={sending} onClick={() => { commentRef.current?.focus(); commentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="rounded-lg border border-zinc-600 px-4 py-2 text-sm">Pedir ajustes</button>
          </div>
          {pendingCount > 0 && <p className="mt-2 text-xs text-amber-200">{pendingCount} ajuste(s) em aberto. Aguarde a resolução e clique em Atualizar status antes de aprovar.</p>}
          {selected.id !== videoVersions[0]?.id && <p className="mt-2 text-xs text-amber-200">Esta versão é anterior. Para aprovar, selecione a mais recente.</p>}
          <p className="mt-3 text-xs text-zinc-500">A decisão vale apenas para esta versão. Qualquer pessoa com o link pode revisar; o nome informado não é verificado e não constitui assinatura digital.</p>
          {decisionError && <p role="alert" className="mt-3 text-sm text-red-300">{decisionError}</p>}
          {decisionSuccess && <p role="status" className="mt-3 text-sm text-emerald-300">{decisionSuccess}</p>}
        </div>
      </section>

      <form onSubmit={submitFeedback} className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
        <h2 className="text-lg font-semibold">Enviar solicitação de ajuste</h2>
        <p className="mt-1 text-sm text-zinc-400">Use “Comentar neste instante” no vídeo ou preencha a minutagem manualmente.</p>
        <fieldset disabled={sending} className="mt-5 space-y-3">
          <label className="block text-sm text-zinc-300">Minutagem (opcional)
            <input value={timestamp} onChange={(event) => draft.update({ timestamp: event.target.value })} maxLength={8}
              placeholder="00:23 ou 01:02:03" className="mt-2 w-full rounded-lg border border-[#303035] bg-[#111113] p-3 text-sm" />
          </label>
          <label className="block text-sm text-zinc-300">O que precisa mudar?
            <textarea ref={commentRef} required value={comment} onChange={(event) => draft.update({ comment: event.target.value })} rows={4} maxLength={2000}
              placeholder="Descreva o ajuste desejado..." className="mt-2 w-full resize-y rounded-lg border border-[#303035] bg-[#111113] p-3 text-sm" />
          </label>
          <p className="text-xs text-zinc-500">{comment.length}/2.000 caracteres</p>
          {(comment || timestamp) && <p className="text-xs text-zinc-400">Rascunho separado por versão, salvo neste navegador quando o armazenamento está disponível. Ainda não foi enviado ao editor.</p>}
          {timestamp && <button type="button" onClick={() => draft.update({ timestamp: "" })} className="text-xs text-zinc-300 underline">Remover minutagem: comentário geral</button>}
          <button className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-50">{sending ? "Enviando..." : "Enviar solicitação"}</button>
        </fieldset>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        {success && <p role="status" className="mt-4 text-sm text-emerald-300">Solicitação enviada. Obrigado pelo feedback!</p>}
      </form>

      <div className="lg:col-span-2"><VersionComparison versions={videoVersions} token={reviewToken} /></div>

      <section className="rounded-xl border border-[#29292d] bg-[#151517] p-5 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Solicitações desta versão ({requests.length})</h2>
          <button type="button" onClick={refresh} disabled={refreshing || sending} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm disabled:opacity-50">{refreshing ? "Atualizando..." : "Atualizar status"}</button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">Visível para quem possui este link de revisão.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-zinc-300">Filtrar por status
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="ml-2 rounded-lg border border-[#303035] bg-[#111113] p-2">
              {["Todas", "Pendente", "Em andamento", "Resolvido"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <p className="text-xs text-zinc-400">{resolvedCount} de {requests.length} solicitações resolvidas</p>
        </div>
        <div className="mt-4 space-y-3">
          {visibleRequests.map((request) => <article key={request.id} className="rounded-lg border border-[#303035] bg-[#111113] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {selected.videoUrl && request.timestamp && parseTimestamp(request.timestamp) !== null
                ? <button type="button" onClick={() => seekToTimestamp(videoRef.current, request.timestamp!)} className="rounded border border-zinc-600 px-2 py-1 text-zinc-200" aria-label={`Ir para ${request.timestamp} no vídeo`}>▶ {request.timestamp}</button>
                : <span className="text-zinc-400">{request.timestamp || "Sem minutagem"}</span>}
              <span className={request.status === "Resolvido" ? "text-emerald-300" : "text-amber-200"}>{request.status}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-200">{request.comment}</p>
            {request.priority === "Alta" && <p className="mt-2 text-xs text-amber-200">Prioridade alta definida pelo editor</p>}
            {request.authorName && <p className="mt-2 text-xs text-zinc-400">Nome informado: {request.authorName}</p>}
            <p className="mt-2 text-xs text-zinc-500">Registrada em {request.createdAt}</p>
            <ReviewThread request={request} reviewToken={reviewToken} authorName={authorName} />
          </article>)}
          {!visibleRequests.length && <p className="py-4 text-sm text-zinc-400">{requests.length ? "Nenhuma solicitação neste filtro." : "Nenhuma solicitação nesta versão. Assista ao vídeo e envie seu primeiro comentário."}</p>}
        </div>
      </section>
    </div>
  );
}
