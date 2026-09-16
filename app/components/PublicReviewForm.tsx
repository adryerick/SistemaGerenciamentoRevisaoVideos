"use client";

import { useState } from "react";
import type { VideoVersion } from "../types";

type PublicReviewFormProps = {
  reviewToken: string;
  videoVersions: VideoVersion[];
};

export default function PublicReviewForm({
  reviewToken,
  videoVersions,
}: PublicReviewFormProps) {
  const [videoVersionId, setVideoVersionId] = useState(videoVersions[0]?.id ?? 0);
  const [comment, setComment] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  async function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(false);

    if (!comment.trim() || !videoVersionId) {
      alert("Escolha uma versão e escreva sua solicitação.");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/revisao/${reviewToken}/solicitacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoVersionId, comment, timestamp }),
      });
      const result = await response.json();

      if (!response.ok) {
        alert(result.error ?? "Não foi possível enviar a solicitação.");
        return;
      }

      setComment("");
      setTimestamp("");
      setSuccess(true);
    } catch {
      alert("Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  if (videoVersions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#303035] px-5 py-8 text-sm text-zinc-500">
        Ainda não há uma versão de vídeo disponível para revisão.
      </p>
    );
  }

  return (
    <form onSubmit={submitFeedback} className="rounded-xl border border-[#29292d] bg-[#151517] p-5">
      <h2 className="text-lg font-semibold">Enviar solicitação de ajuste</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Informe o que precisa ser alterado. A minutagem é opcional.
      </p>

      <div className="mt-5 space-y-3">
        <select
          value={videoVersionId}
          onChange={(event) => setVideoVersionId(Number(event.target.value))}
          className="w-full rounded-lg border border-[#303035] bg-[#111113] px-3 py-2.5 text-sm text-zinc-200 outline-none"
        >
          {videoVersions.map((videoVersion) => (
            <option key={videoVersion.id} value={videoVersion.id}>
              Versão {videoVersion.number.toString().padStart(2, "0")} · {videoVersion.fileName}
            </option>
          ))}
        </select>

        <input
          value={timestamp}
          onChange={(event) => setTimestamp(event.target.value)}
          placeholder="Minutagem opcional, ex.: 00:23"
          className="w-full rounded-lg border border-[#303035] bg-[#111113] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600"
        />

        <textarea
          required
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Descreva o ajuste desejado..."
          className="w-full resize-none rounded-lg border border-[#303035] bg-[#111113] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600"
        />

        <button
          disabled={sending}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Enviando..." : "Enviar solicitação"}
        </button>
      </div>

      {success && (
        <p className="mt-4 rounded-lg bg-emerald-950/50 px-3 py-2 text-sm text-emerald-300">
          Solicitação enviada. Obrigado pelo feedback!
        </p>
      )}
    </form>
  );
}
