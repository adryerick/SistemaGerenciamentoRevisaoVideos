import type { VideoVersion } from "../types";

export default function VersionReviewStatus({ version }: { version: VideoVersion }) {
  return <div className={`mt-3 rounded-lg border p-3 ${version.reviewStatus === "Aprovado" ? "border-emerald-900 bg-emerald-950/20" : "border-zinc-700 bg-zinc-900/30"}`}>
    <p className="text-sm font-medium">{version.reviewStatus ?? "Em revisão"}</p>
    {version.reviewedAt && <p className="mt-1 text-xs text-zinc-400">{version.reviewedBy ? `Nome informado: ${version.reviewedBy} · ` : ""}{version.reviewedAt}</p>}
  </div>;
}
