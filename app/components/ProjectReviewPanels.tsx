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
  const [fileName, setFileName] = useState("");
  const [comment, setComment] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [videoVersionId, setVideoVersionId] = useState(videoVersions[0]?.id ?? 0);

  async function handleCreateVersion() {
    if (!fileName.trim()) {
      alert("Informe o nome do arquivo da nova versão.");
      return;
    }

    const response = await fetch(`/api/projetos/${projectId}/versoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName }),
    });
    const result = await response.json();

    if (!response.ok) {
      alert(result.error ?? "Não foi possível registrar a versão.");
      return;
    }

    setVersions((currentVersions) => [result, ...currentVersions]);
    setVideoVersionId(result.id);
    setFileName("");
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
            <p className="text-sm font-medium text-white">Registrar nova versão</p>
            <div className="mt-3 flex gap-3">
              <input
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                placeholder="Ex.: campanha-v04.mp4"
                className="min-w-0 flex-1 rounded-lg border border-[#303035] bg-[#151517] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
              />
              <button
                onClick={handleCreateVersion}
                className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Adicionar
              </button>
            </div>
          </div>

          {versions.map((videoVersion) => (
            <div
              key={videoVersion.id}
              className="rounded-lg border border-[#29292d] bg-[#111113] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#222225] px-2.5 py-1 text-[11px] text-zinc-300">
                  V{videoVersion.number.toString().padStart(2, "0")}
                </span>
                <span className="text-xs text-zinc-500">
                  Enviada em {videoVersion.sentAt}
                </span>
              </div>
              <p className="mt-3 text-sm text-zinc-300">{videoVersion.fileName}</p>
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
