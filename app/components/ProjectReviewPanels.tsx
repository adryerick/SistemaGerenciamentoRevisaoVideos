"use client";

import { useState } from "react";
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
  const [versions, setVersions] = useState(videoVersions);
  const [requests, setRequests] = useState(changeRequests);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [comment, setComment] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [videoVersionId, setVideoVersionId] = useState(videoVersions[0]?.id ?? 0);

  async function handleCreateVersion() {
    if (!videoFile) {
      setUploadError("Selecione o arquivo de vídeo da nova versão.");
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

      setVersions((currentVersions) => [result, ...currentVersions]);
      setVideoVersionId(result.id);
      setVideoFile(null);
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

        setVersions((currentVersions) =>
          currentVersions.filter((version) => version.id !== versionId),
        );

        setRequests((currentRequests) =>
          currentRequests.filter(
            (request) => request.videoVersionId !== versionId,
          ),
        );

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
    const response = await fetch(`/api/solicitacoes/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      alert("Não foi possível atualizar o status.");
      return;
    }

    const updatedRequest = await response.json();
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? updatedRequest : request,
      ),
    );
  }

  async function handleDeleteRequest(requestId: number) {
    if (!window.confirm("Excluir esta solicitação de alteração?")) {
      return;
    }

    const response = await fetch(`/api/solicitacoes/${requestId}`, {
      method: "DELETE",
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      alert(result.error ?? "Não foi possível excluir a solicitação.");
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.filter((request) => request.id !== requestId),
    );
  }

  async function handleCreateRequest() {
    if (!comment.trim() || !videoVersionId) {
      alert("Informe o comentário e selecione uma versão.");
      return;
    }

    const response = await fetch(`/api/projetos/${projectId}/solicitacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment, timestamp, videoVersionId }),
    });
    const result = await response.json();

    if (!response.ok) {
      alert(result.error ?? "Não foi possível registrar a solicitação.");
      return;
    }

    setRequests((currentRequests) => [result, ...currentRequests]);
    setComment("");
    setTimestamp("");
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
                accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
                onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                className="min-w-0 flex-1 rounded-lg border border-[#303035] bg-[#151517] px-3 py-2 text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1 file:text-xs file:text-zinc-200"
              />
              <button
                onClick={handleCreateVersion}
                disabled={isUploading}
                className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "Enviando..." : "Enviar vídeo"}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-600">MP4, MOV, WebM ou M4V · até 250 MB</p>
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
                <video
                  controls
                  preload="metadata"
                  src={videoVersion.videoUrl}
                  className="mt-3 w-full rounded-lg bg-black"
                />
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

        <div className="mt-5 space-y-3">
          {versions.length > 0 && (
            <div className="rounded-lg border border-[#29292d] bg-[#111113] p-4">
              <p className="text-sm font-medium text-white">Nova solicitação</p>

              <div className="mt-3 space-y-3">
                <select
                  value={videoVersionId}
                  onChange={(event) => setVideoVersionId(Number(event.target.value))}
                  className="w-full rounded-lg border border-[#303035] bg-[#151517] px-3 py-2 text-sm text-zinc-300 outline-none"
                >
                  {versions.map((videoVersion) => (
                    <option key={videoVersion.id} value={videoVersion.id}>
                      Versão {videoVersion.number.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>

                <input
                  value={timestamp}
                  onChange={(event) => setTimestamp(event.target.value)}
                  placeholder="Minutagem opcional, ex.: 00:23"
                  className="w-full rounded-lg border border-[#303035] bg-[#151517] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
                />

                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Descreva a alteração solicitada..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#303035] bg-[#151517] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
                />

                <button
                  onClick={handleCreateRequest}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                >
                  Registrar solicitação
                </button>
              </div>
            </div>
          )}

          {requests.length > 0 ? (
            requests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-[#29292d] bg-[#111113] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">
                    {request.timestamp || "Sem minutagem"}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
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
                      type="button"
                      onClick={() => void handleDeleteRequest(request.id)}
                      className="rounded-md border border-red-900/40 px-2 py-1 text-xs text-red-400 transition hover:border-red-800 hover:bg-red-950/30 hover:text-red-300"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-300">{request.comment}</p>
                <p className="mt-2 text-xs text-zinc-600">
                  Registrada em {request.createdAt}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-[#29292d] px-4 py-6 text-sm text-zinc-500">
              Nenhuma solicitação registrada para este projeto.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
