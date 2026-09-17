import { parseTimestamp } from "./review-feedback";

export function validateReviewerName(value: unknown): { name: string | null } | { error: string } {
  if (value === undefined || value === null || value === "") return { name: null };
  if (typeof value !== "string" || value.trim().length > 80) return { error: "Informe um nome com até 80 caracteres." };
  return { name: value.trim() || null };
}

export function validateReply(value: unknown): { comment: string; name: string | null } | { error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "Resposta inválida." };
  const body = value as Record<string, unknown>;
  const name = validateReviewerName(body.authorName);
  if ("error" in name) return name;
  if (typeof body.comment !== "string" || !body.comment.trim() || body.comment.trim().length > 2000) return { error: "Escreva uma resposta de 1 a 2.000 caracteres." };
  return { comment: body.comment.trim(), name: name.name };
}

export function timelineMarkers<T extends { id: number; timestamp?: string }>(requests: T[], duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return [];
  return requests.flatMap((request) => {
    const seconds = parseTimestamp(request.timestamp ?? "");
    return seconds === null || seconds > duration ? [] : [{ ...request, seconds, percentage: seconds / duration * 100 }];
  }).sort((a, b) => a.seconds - b.seconds || a.id - b.id);
}
