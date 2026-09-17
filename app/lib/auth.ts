import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, readAuthConfig, verifySession } from "./auth-core";
import { prisma } from "./prisma";

export async function getAuthenticatedEditor() {
  const config = await readAuthConfig();
  const id = verifySession((await cookies()).get(AUTH_COOKIE)?.value, config);
  if (!id) return null;
  return prisma.editor.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
}

export async function requireEditor() {
  const editor = await getAuthenticatedEditor();
  if (!editor) redirect("/");
  return editor;
}

export function withEditor<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args) => {
    if (!await getAuthenticatedEditor()) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
    return handler(...args);
  };
}
