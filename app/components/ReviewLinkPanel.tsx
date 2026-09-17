"use client";

import { useState } from "react";

type ReviewLinkPanelProps = {
  projectId: number;
  reviewToken: string;
  initialReviewEnabled: boolean;
};

export default function ReviewLinkPanel({
  projectId,
  reviewToken,
  initialReviewEnabled,
}: ReviewLinkPanelProps) {
  const [reviewEnabled, setReviewEnabled] = useState(initialReviewEnabled);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reviewPath = `/revisao/${reviewToken}`;

  async function copyLink() {
    setError("");
    try {
    await navigator.clipboard.writeText(
      new URL(reviewPath, window.location.origin).toString(),
    );
    setCopied(true);
    } catch { setError("Não foi possível copiar automaticamente. Abra o link abaixo e copie o endereço do navegador."); }
  }

  async function updateReviewAccess() {
    if (busy) return;
    setBusy(true); setError("");
    try {
    const response = await fetch(`/api/projetos/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewEnabled: !reviewEnabled }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.error ?? "Não foi possível atualizar o link.");
      return;
    }

    setReviewEnabled(result.reviewEnabled);
    } catch { setError("Falha de conexão. Tente novamente."); }
    finally { setBusy(false); }
  }

  return (
    <section className="mt-8 rounded-xl border border-[#29292d] bg-[#151517] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Link de revisão do cliente</h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Quem tiver este link poderá visualizar as versões e enviar solicitações,
            sem precisar criar uma conta.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs ${reviewEnabled ? "bg-emerald-950/60 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}
        >
          {reviewEnabled ? "Link ativo" : "Link desativado"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          readOnly
          value={reviewPath}
          aria-label="Link público de revisão"
          className="min-w-0 flex-1 rounded-lg border border-[#303035] bg-[#111113] px-3 py-2.5 text-sm text-zinc-400 outline-none"
        />
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          {copied ? "Copiado" : "Copiar link"}
        </button>
        <button
          type="button"
          onClick={() => void updateReviewAccess()}
          disabled={busy}
          className="rounded-lg border border-[#303035] px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-[#232328]"
        >
          {reviewEnabled ? "Desativar link" : "Ativar link"}
        </button>
      </div>
      <a href={reviewPath} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-zinc-300 underline">Abrir revisão em outra aba</a>
      <p className="mt-2 text-xs text-zinc-500">Se o endereço começa com localhost, ele funciona apenas neste computador. Para clientes externos, será necessário publicar o sistema.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  );
}
