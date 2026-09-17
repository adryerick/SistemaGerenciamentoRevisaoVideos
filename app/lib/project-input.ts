export type NewProjectInput = { name: string; clientId: number; description: string };

export function readNewProjectForm(form: FormData): NewProjectInput {
  return {
    name: String(form.get("name") ?? "").trim(),
    clientId: Number(form.get("clientId")),
    description: String(form.get("description") ?? "").trim(),
  };
}
