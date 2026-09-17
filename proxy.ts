import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, readAuthConfig, verifySession } from "./app/lib/auth-core";
import { publicOrigin } from "./app/lib/public-origin";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const mutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const origin = request.headers.get("origin");
  if (mutation && (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== publicOrigin(request.url)))) {
    return NextResponse.json({ error: "Origem da solicitação não permitida." }, { status: 403 });
  }
  const publicRoute = pathname.startsWith("/api/revisao/") || pathname.startsWith("/api/auth/");
  if (publicRoute) return NextResponse.next();
  const config = await readAuthConfig();
  const id = verifySession(request.cookies.get(AUTH_COOKIE)?.value, config);
  if (!id) {
    if (pathname.startsWith("/api/") || pathname.startsWith("/uploads/")) {
      return NextResponse.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/projetos/:path*", "/clientes/:path*", "/api/:path*", "/uploads/:path*"],
};
