"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VideoPlayer from "./VideoPlayer";
import { formatTimestamp, parseTimestamp, validateReviewInput } from "../lib/review-feedback";
import { seekToTimestamp } from "../lib/video-navigation";
import { VIDEO_ACCEPT, validateVideoFile } from "../lib/video-formats";
import type { ChangeRequest, VideoVersion } from "../types";
import { uploadVideo } from "../lib/upload-video";
import ReviewThread from "./ReviewThread";
import VersionReviewStatus from "./VersionReviewStatus";
import VersionComparison from "./VersionComparison";
import { priorities, sortRequests } from "../lib/request-priority";
import VideoJobs from "./VideoJobs";

type ProjectReviewPanelsProps = {
  projectId: number;
  videoVersions: VideoVersion[];
  changeRequests: ChangeRequest[];
};

const requestStatuses: ChangeRequest["status"][] = [
  "Pendente",
  "Em andamento",
  "Resolvido",
];

export default function ProjectReviewPanels({
  projectId,
  videoVersions,
  changeRequests,
}: ProjectReviewPanelsProps) {
  const router = useRouter();
  const versions = videoVersions;
  const requests = changeRequests;
  const players = useRef(new Map<number, HTMLVideoElement>());
  const commentInput = useRef<HTMLTextAreaElement>(null);
  const [requestError, setRequestError] = useState("");
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestFilter, setRequestFilter] = useState("Todas");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const videoInput = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [videoVersionId, setVideoVersionId] = useState(videoVersions[0]?.id ?? 0);
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const visibleRequests = sortRequests(requests.filter((request) => (requestFilter === "Todas" || request.status === requestFilter) && (priorityFilter === "Todas" || (request.priority ?? "Normal") === priorityFilter)));

  async function changePriority(requestId: number, priority: string) {
    if (requestBusy) return;
    setRequestBusy(true); setRequestError("");
    try {
      const response = await fetch(`/api/solicitacoes/${requestId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priority }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setRequestError(result.error ?? "Não foi possível atualizar a prioridade."); return; }
      router.refresh();
    } catch { setRequestError("Falha de conexão ao atualizar a prioridade."); }
    finally { setRequestBusy(false); }
  }

  async function handleCreateVersion() {
    if (isUploading) return;
    if (!videoFile) {
      setUploadError("Selecione o arquivo de vídeo da nova versão.");
      return;
    }

    const validationError = validateVideoFile(videoFile.name, videoFile.size);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");
    setUploadProgress(0);
    try {
      const result = await uploadVideo(`/api/projetos/${projectId}/versoes`, videoFile, setUploadProgress);

      router.refresh();
      if (!result.queued) setVideoVersionId(result.id);
      setVideoFile(null);
      if (videoInput.current) videoInput.current.value = "";
      setUploadSuccess(result.queued ? "Arquivo recebido! O preparo continua em segundo plano; você já pode sair desta página. Acompanhe o andamento abaixo." : "Vídeo preparado e disponível para o cliente.");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar o vídeo. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  }
      async function handleDeleteVersion(versionId: number) {
      const confirmed = window.confirm(
        "Tem certeza que deseja excluir esta versão? O arquivo de vídeo também será apagado.",
      );

      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch(`/api/projetos/${projectId}/versoes`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ versionId }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          alert(result.error ?? "Não foi possível excluir a versão.");
          return;
        }

        router.refresh();

        if (videoVersionId === versionId) {
          const remainingVersion = versions.find(
            (version) => version.id !== versionId,
          );

          setVideoVersionId(remainingVersion?.id ?? 0);
        }
      } catch {
        alert("Não foi possível excluir a versão. Tente novamente.");
      }
    }   
    
  async function handleStatusChange(
    requestId: number,
    status: ChangeRequest["status"],
  ) {
    if (requestBusy) return;
    setRequestBusy(true);
    setRequestError("");
    try {
    const response = await fetch(`/api/solicitacoes/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setRequestError("Não foi possível atualizar o status.");
      return;
    }

    router.refresh();
    } catch {
      setRequestError("Falha de conexão ao atualizar o status. Tente novamente.");
    } finally { setRequestBusy(false); }
  }

  async function handleDeleteRequest(requestId: number) {
    if (requestBusy) return;
    if (!window.confirm("Excluir esta solicitação de alteração?")) {
      return;
    }

    setRequestBusy(true);
    setRequestError("");
    try {
    const response = await fetch(`/api/solicitacoes/${requestId}`, {
      method: "DELETE",
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setRequestError(result.error ?? "Não foi possível excluir a solicitação.");
      return;
    }

    router.refresh();
    } catch {
      setRequestError("Falha de conexão ao excluir. Tente novamente.");
    } finally { setRequestBusy(false); }
  }

  async function handleCreateRequest() {
    if (requestBusy) return;
    const input = validateReviewInput({ comment, timestamp, videoVersionId });
    if ("error" in input) { setRequestError(input.error); return; }
    setRequestBusy(true);
    setRequestError("");
    try {
    const response = await fetch(`/api/projetos/${projectId}/solicitacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setRequestError(result.error ?? "Não foi possível registrar a solicitação.");
      return;
    }

    router.refresh();
    setComment("");
    setTimestamp("");
    } catch {
      setRequestError("Falha de conexão. Seu comentário foi mantido; tente novamente.");
    } finally { setRequestBusy(false); }
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="xl:col-span-2"><VersionComparison versions={versions} /></div>
      <section className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Versões de vídeo</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Histórico de arquivos enviados para revisão.
            </p>
          </div>

          <span className="text-sm text-zinc-500">{versions.length}</span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-lg border border-[#29292d] bg-[#111113] p-4">
            <p className="text-sm font-medium text-white">Enviar nova versão</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                type="file"
                ref={videoInput}
                aria-label="Arquivo da nova versão"
                disabled={isUploading}
                accept={VIDEO_ACCEPT}
                onChange={(event) => { setVideoFile(event.target.files?.[0] ?? null); setUploadError(""); setUploadSuccess(""); }}
                className="min-w-0 flex-1 rounded-lg border border-[#303035] bg-[#151517] px-3 py-2 text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-xs file:text-zinc-200"
              />
              <button
                onClick={handleCreateVersion}
                disabled={isUploading}
                className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? uploadProgress === 100 ? "Confirmando recebimento..." : `Enviando ${uploadProgress}%` : "Enviar vídeo"}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-400">MP4, MOV, WebM, M4V, MKV, AVI, MTS ou M2TS · até 250 MB</p>
            <p className="mt-2 text-xs text-zinc-500">No link gratuito da Cloudflare, prefira arquivos de até 95 MB. Para maiores, envie pelo endereço local; a revisão continua disponível no link público.</p>
            {videoFile && <p className="mt-2 break-all text-xs text-zinc-300">{videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>}
            {isUploading && <progress aria-label="Progresso do envio do vídeo" value={uploadProgress} max={100} className="mt-3 h-2 w-full accent-emerald-400" />}
            <p role="status" className="mt-2 text-xs text-zinc-400">
              {isUploading
                ? uploadProgress === 100 ? "Arquivo transmitido. Aguarde o servidor confirmar o recebimento antes de sair desta página." : "Enviando o arquivo. Mantenha esta página aberta até a confirmação."
                : "Após confirmar o recebimento, o servidor converterá o vídeo em segundo plano. A nova versão aparece quando o preparo terminar."}
            </p>
            {uploadError && <p role="alert" className="mt-2 text-xs text-red-300">{uploadError}</p>}
            {uploadSuccess && <p role="status" className="mt-2 text-xs text-emerald-300">{uploadSuccess}</p>}
          </div>

          <VideoJobs projectId={projectId} />

          {versions.map((videoVersion) => (
            <div
              key={videoVersion.id}
              id={`version-${videoVersion.id}`}
              className="rounded-lg border border-[#29292d] bg-[#111113] p-4"
            >
              <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#222225] px-2.5 py-1 text-[11px] text-zinc-300">
                  V{videoVersion.number.toString().padStart(2, "0")}
                </span>

                <button
                  type="button"
                  onClick={() => handleDeleteVersion(videoVersion.id)}
                  className="rounded-md border border-red-900/40 px-2 py-1 text-xs text-red-400 transition hover:border-red-800 hover:bg-red-950/30 hover:text-red-300"
                >
                  Excluir
                </button>
              </div>

              <span className="text-xs text-zinc-500">
                Enviada em {videoVersion.sentAt}
              </span>
            </div>
              <p className="mt-3 text-sm text-zinc-300">{videoVersion.fileName}</p>
              <VersionReviewStatus version={videoVersion} />
              {videoVersion.videoUrl ? (
                <VideoPlayer key={videoVersion.videoUrl} src={videoVersion.videoUrl}
                  requests={requests.filter((request) => request.videoVersionId === videoVersion.id)}
                  videoRef={(element) => {
                    if (element) players.current.set(videoVersion.id, element);
                    else players.current.delete(videoVersion.id);
                  }}
                  onMarkTime={requestBusy ? undefined : (seconds) => {
                    setVideoVersionId(videoVersion.id);
                    setTimestamp(formatTimestamp(seconds));
                    commentInput.current?.focus();
                    commentInput.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }} />
              ) : (
                <p className="mt-2 text-xs text-zinc-600">Arquivo de vídeo ainda não enviado.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Solicitações</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Atualize o andamento de cada feedback recebido.
            </p>
          </div>

          <span className="text-sm text-zinc-500">{requests.length}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select aria-label="Filtrar solicitações por status" value={requestFilter}
            onChange={(event) => setRequestFilter(event.target.value)} className="rounded-lg border border-[#303035] bg-[#111113] p-2 text-sm">
            {["Todas", ...requestStatuses].map((status) => <option key={status}>{status}</option>)}
          </select>
          <button type="button" disabled={requestBusy} onClick={() => router.refresh()} className="text-sm text-zinc-300 underline">Atualizar solicitações</button>
          <select aria-label="Filtrar solicitações por prioridade" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="rounded-lg border border-zinc-700 bg-[#111113] p-2 text-sm">
            <option>Todas</option>{priorities.map((priority) => <option key={priority}>{priority}</option>)}
          </select>
        </div>
        <p className="mt-3 text-xs text-zinc-400">Checklist: {requests.filter((request) => request.status === "Resolvido").length}/{requests.length} resolvidas. Ajustes em aberto e de alta prioridade aparecem primeiro.</p>
        {requestError && <p role="alert" className="mt-3 text-sm text-red-300">{requestError}</p>}
        <div className="mt-5 space-y-3">
          {versions.length > 0 && (
            <div className="rounded-lg border border-[#29292d] bg-[#111113] p-4">
              <p className="text-sm font-medium text-white">Nova solicitação</p>

              <div className="mt-3 space-y-3">
                <select
                  disabled={requestBusy}
                  aria-label="Versão da nova solicitação"
                  value={videoVersionId}
                  onChange={(event) => { setVideoVersionId(Number(event.target.value)); setTimestamp(""); }}
                  className="w-full rounded-lg border border-[#303035] bg-[#151517] px-3 py-2 text-sm text-zinc-300 outline-none"
                >
                  {versions.map((videoVersion) => (
                    <option key={videoVersion.id} value={videoVersion.id}>
                      Versão {videoVersion.number.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>

                <input
                  disabled={requestBusy}
                  aria-label="Minutagem da solicitação"
                  maxLength={8}
                  value={timestamp}
                  onChange={(event) => setTimestamp(event.target.value)}
                  placeholder="Minutagem opcional, ex.: 00:23"
                  className="w-full rounded-lg border border-[#303035] bg-[#151517] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
                />

                <textarea
                  ref={commentInput}
                  disabled={requestBusy}
                  aria-label="Comentário da solicitação"
                  maxLength={2000}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Descreva a alteração solicitada..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#303035] bg-[#151517] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
                />

                <button
                  disabled={requestBusy}
                  onClick={handleCreateRequest}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                >
                  {requestBusy ? "Salvando..." : "Registrar solicitação"}
                </button>
              </div>
            </div>
          )}

          {visibleRequests.length > 0 ? (
            visibleRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-[#29292d] bg-[#111113] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  {request.timestamp && parseTimestamp(request.timestamp) !== null && versions.some((version) => version.id === request.videoVersionId && version.videoUrl)
                    ? <button type="button" onClick={() => seekToTimestamp(players.current.get(request.videoVersionId), request.timestamp!)}
                        className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-200" aria-label={`Ir para ${request.timestamp} no vídeo`}>▶ {request.timestamp}</button>
                    : <span className="text-xs text-zinc-500">{request.timestamp || "Sem minutagem"}</span>}
                  <div className="flex items-center gap-2">
                    <select
                      disabled={requestBusy}
                      value={request.status}
                      onChange={(event) =>
                        handleStatusChange(
                          request.id,
                          event.target.value as ChangeRequest["status"],
                        )
                      }
                      aria-label={`Status da solicitação ${request.id}`}
                      className="rounded-full border border-[#303035] bg-[#262429] px-2.5 py-1 text-[11px] text-[#aaa4b0] outline-none"
                    >
                      {requestStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={requestBusy}
                      type="button"
                      onClick={() => void handleDeleteRequest(request.id)}
                      className="rounded-md border border-red-900/40 px-2 py-1 text-xs text-red-400 transition hover:border-red-800 hover:bg-red-950/30 hover:text-red-300"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-300">{request.comment}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={request.status === "Resolvido"} disabled={requestBusy} onChange={(event) => handleStatusChange(request.id, event.target.checked ? "Resolvido" : "Pendente")} />Ajuste concluído</label>
                  <label>Prioridade <select aria-label={`Prioridade da solicitação ${request.id}`} disabled={requestBusy} value={request.priority ?? "Normal"} onChange={(event) => changePriority(request.id, event.target.value)} className="ml-2 rounded border border-zinc-700 bg-[#151517] p-1">{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
                </div>
                {request.authorName && <p className="mt-2 text-xs text-zinc-400">Nome informado: {request.authorName}</p>}
                <p className="mt-2 text-xs text-zinc-600">
                  V{String(versions.find((version) => version.id === request.videoVersionId)?.number ?? "?").padStart(2, "0")} · Registrada em {request.createdAt}
                </p>
                <ReviewThread request={request} />
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-[#29292d] px-4 py-6 text-sm text-zinc-500">
              Nenhuma solicitação encontrada neste filtro.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
