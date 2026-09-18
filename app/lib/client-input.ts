export type ClientInput = { name: string; email: string };

export function validateClientInput(body: unknown): ClientInput | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Informe os dados do cliente para continuar." };
  }
  const data = body as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!name || !email) return { error: "Nome e e-mail são obrigatórios." };
  if (name.length > 120) return { error: "Informe um nome de até 120 caracteres." };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Informe um e-mail válido de até 254 caracteres." };
  }
  return { name, email };
}
