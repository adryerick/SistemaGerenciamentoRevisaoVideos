import { NextResponse } from "next/server";
import { AUTH_COOKIE, SESSION_SECONDS, createSession, readAuthConfig, verifyPassword } from "../../../lib/auth-core";

// Single-process local MVP. Public deployment needs a shared rate limiter.
let attempts = 0;
let windowEnds = 0;
export async function POST(request: Request) {
  if (Date.now() >= windowEnds) { attempts = 0; windowEnds = Date.now() + 60000; }
  if (++attempts > 10) return Response.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429, headers: { "Retry-After": "60" } });
  const config = await readAuthConfig();
  if (!config) return Response.json({ error: "Configure primeiro a conta do editor com npm run auth:prepare." }, { status: 409 });
  const body = await request.json().catch(() => null);
  if (typeof body?.email !== "string" || typeof body?.password !== "string" || body.password.length > 128) return Response.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  const passwordValid = await verifyPassword(body.password, config.passwordHash);
  if (!passwordValid || body.email.trim().toLowerCase() !== config.email) return Response.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  attempts = 0;
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, createSession(config), { httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:", maxAge: SESSION_SECONDS, path: "/" });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
