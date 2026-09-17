import { randomBytes } from "node:crypto";
import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, SESSION_SECONDS, authDirectory, authFile, createSession, hashPassword, readAuthConfig, safeEqual } from "../../../lib/auth-core";
import { prisma } from "../../../lib/prisma";
import { publicOrigin } from "../../../lib/public-origin";

export async function POST(request: Request) {
  if (await readAuthConfig()) return Response.json({ error: "A conta já foi configurada." }, { status: 409 });
  const body = await request.json().catch(() => null);
  const token = await readFile(path.join(authDirectory, "setup-token"), "utf8").catch(() => "");
  if (!token || typeof body?.token !== "string" || !safeEqual(body.token, token.trim())) return Response.json({ error: "Código de configuração inválido. Execute npm run auth:prepare no computador do projeto." }, { status: 403 });
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 128) {
    return Response.json({ error: "Informe nome, e-mail válido e uma senha de 12 a 128 caracteres." }, { status: 400 });
  }
  await mkdir(authDirectory, { recursive: true });
  const lockFile = path.join(authDirectory, "setup.lock");
  const lock = await open(lockFile, "wx").catch(() => null);
  if (!lock) return Response.json({ error: "Configuração em andamento. Tente novamente." }, { status: 409 });
  try {
    if (await readAuthConfig()) return Response.json({ error: "A conta já foi configurada." }, { status: 409 });
    const passwordHash = await hashPassword(password);
    const legacy = await prisma.editor.findUnique({ where: { email: "adryerick@videoreview.local" } });
    const editor = legacy ?? await prisma.editor.create({ data: { name, email } });
    // Keep the existing editor ID and all related projects/clients intact.
    const config = { editorId: editor.id, email, passwordHash, secret: randomBytes(32).toString("hex") };
    await writeFile(authFile, JSON.stringify(config), { flag: "wx", mode: 0o600 });
    await prisma.editor.update({ where: { id: editor.id }, data: { name } });
    await rm(path.join(authDirectory, "setup-token"), { force: true });
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE, createSession(config), { httpOnly: true, sameSite: "lax", secure: publicOrigin(request.url).startsWith("https:"), maxAge: SESSION_SECONDS, path: "/" });
    return response;
  } finally { await lock.close(); await rm(lockFile, { force: true }); }
}
