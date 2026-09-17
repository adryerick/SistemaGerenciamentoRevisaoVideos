"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VideoPlayer from "./VideoPlayer";
import { formatTimestamp, parseTimestamp, validateReviewInput } from "../lib/review-feedback";
import { seekToTimestamp } from "../lib/video-navigation";
import { VIDEO_ACCEPT, validateVideoFile } from "../lib/video-formats";
import type { ChangeRequest, VideoVersion } from "../types";

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
  const videoInput = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [videoVersionId, setVideoVersionId] = useState(videoVersions[0]?.id ?? 0);
  const visibleRequests = requests.filter((request) => requestFilter === "Todas" || request.status === requestFilter);

  async function handleCreateVersion() {
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
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      const response = await fetch(`/api/projetos/${projectId}/versoes`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setUploadError(result.error ?? "Não foi possível enviar a versão. Tente novamente.");
        return;
      }

      router.refresh();
      setVideoVersionId(result.id);
      setVideoFile(null);
      if (videoInput.current) videoInput.current.value = "";
    } catch {
      setUploadError("Não foi possível enviar o vídeo. Tente novamente.");
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
                onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                className="min-w-0 flex-1 rounded-lg border border-[#303035] bg-[#151517] px-3 py-2 text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-xs file:text-zinc-200"
              />
              <button
                onClick={handleCreateVersion}
                disabled={isUploading}
                className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "Preparando vídeo..." : "Enviar vídeo"}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-400">MP4, MOV, WebM, M4V, MKV, AVI, MTS ou M2TS · até 250 MB</p>
            <p role="status" className="mt-2 text-xs text-zinc-400">
              {isUploading
                ? "Enviando e preparando para reprodução. Isso pode levar alguns minutos; mantenha esta página aberta."
                : "O vídeo será convertido automaticamente para reprodução no navegador."}
            </p>
            {uploadError && <p className="mt-2 text-xs text-red-300">{uploadError}</p>}
          </div>

          {versions.map((videoVersion) => (
            <div
              key={videoVersion.id}
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
              {videoVersion.videoUrl ? (
                <VideoPlayer key={videoVersion.videoUrl} src={videoVersion.videoUrl}
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
        </div>
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
                <p className="mt-2 text-xs text-zinc-600">
                  V{String(versions.find((version) => version.id === request.videoVersionId)?.number ?? "?").padStart(2, "0")} · Registrada em {request.createdAt}
                </p>
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
