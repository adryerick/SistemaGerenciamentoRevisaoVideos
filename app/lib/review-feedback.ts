/** Accepts MM:SS or HH:MM:SS; blank timestamps remain optional. */
export function parseTimestamp(value: string): number | null {
  const text = value.trim();
  if (!/^(?:\d{1,2}:)?\d{1,2}:[0-5]\d$/.test(text)) return null;
  const parts = text.split(":").map(Number);
  if (parts.length === 3 && parts[1] > 59) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function formatTimestamp(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return [ ...(hours ? [hours] : []), minutes, rest ]
    .map((part) => String(part).padStart(2, "0")).join(":");
}

export function validateReviewInput(body: unknown):
  | { error: string }
  | { comment: string; timestamp: string | null; videoVersionId: number } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Dados da solicitação inválidos." };
  }
  const data = body as Record<string, unknown>;
  const comment = typeof data.comment === "string" ? data.comment.trim() : "";
  if (!comment || comment.length > 2000) {
    return { error: "Escreva um comentário de até 2.000 caracteres." };
  }
  if (typeof data.videoVersionId !== "number" || !Number.isSafeInteger(data.videoVersionId) || data.videoVersionId <= 0) {
    return { error: "Selecione uma versão de vídeo válida." };
  }
  if (data.timestamp != null && typeof data.timestamp !== "string") {
    return { error: "Use a minutagem no formato MM:SS ou HH:MM:SS." };
  }
  const timestamp = typeof data.timestamp === "string" ? data.timestamp.trim() : "";
  const seconds = timestamp ? parseTimestamp(timestamp) : null;
  if (timestamp && seconds === null) {
    return { error: "Use a minutagem no formato MM:SS ou HH:MM:SS, como 00:23." };
  }
  return { comment, videoVersionId: data.videoVersionId, timestamp: seconds === null ? null : formatTimestamp(seconds) };
}
