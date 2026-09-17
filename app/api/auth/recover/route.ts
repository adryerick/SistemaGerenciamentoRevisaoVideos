import { NextResponse } from "next/server";
import { AUTH_COOKIE, SESSION_SECONDS, createSession } from "../../../lib/auth-core";
import { recoverAccount } from "../../../lib/auth-recovery";
import { publicOrigin } from "../../../lib/public-origin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof body?.password !== "string" || body.password.length < 12 || body.password.length > 128 || body.password !== body.confirmPassword || typeof body.token !== "string") {
    return Response.json({ error: "Informe um e-mail válido e confirme a nova senha de 12 a 128 caracteres." }, { status: 400 });
  }
  const config = await recoverAccount(body.token, email, body.password);
  if (!config) return Response.json({ error: "Código inválido, expirado ou já utilizado. Gere outro com npm run auth:recover." }, { status: 403 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, createSession(config), { httpOnly: true, sameSite: "lax", secure: publicOrigin(request.url).startsWith("https:"), maxAge: SESSION_SECONDS, path: "/" });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
