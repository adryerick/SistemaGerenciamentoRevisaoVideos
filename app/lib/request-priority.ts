import type { ChangeRequest } from "../types";

export const priorities = ["Alta", "Normal", "Baixa"] as const;
export function isPriority(value: unknown): value is typeof priorities[number] {
  return priorities.some((priority) => value === priority);
}
export function sortRequests(requests: ChangeRequest[]) {
  return [...requests].sort((a, b) => Number(a.status === "Resolvido") - Number(b.status === "Resolvido")
    || priorities.indexOf(a.priority ?? "Normal") - priorities.indexOf(b.priority ?? "Normal") || b.id - a.id);
}
