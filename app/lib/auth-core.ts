import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const AUTH_COOKIE = "videoreview_session";
export const SESSION_SECONDS = 8 * 60 * 60;
export const authDirectory = process.env.VIDEOREVIEW_AUTH_DIR ?? path.join(process.cwd(), ".local");
export const authFile = path.join(authDirectory, "auth.json");
export type AuthConfig = { editorId: number; email: string; passwordHash: string; secret: string };

export async function readAuthConfig(): Promise<AuthConfig | null> {
  try { return JSON.parse(await readFile(authFile, "utf8")) as AuthConfig; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error; // A broken config must never reopen initial setup.
  }
}

export function safeEqual(first: string, second: string): boolean {
  const a = Buffer.from(first); const b = Buffer.from(second);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64,
    { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
    (error, key) => error ? reject(error) : resolve(key)));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await derive(password, salt)).toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, expected] = hash.split(":");
  if (!salt || !expected || password.length > 128) return false;
  return safeEqual((await derive(password, salt)).toString("hex"), expected);
}

export function createSession(config: AuthConfig, now = Date.now()): string {
  const payload = `${config.editorId}.${Math.floor(now / 1000) + SESSION_SECONDS}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${createHmac("sha256", config.secret).update(payload).digest("hex")}`;
}

export function verifySession(token: string | undefined, config: AuthConfig | null, now = Date.now()): number | null {
  if (!token || !config || token.length > 256) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [editorId, expiry, nonce, signature] = parts;
  if (!/^\d+$/.test(editorId) || !/^\d+$/.test(expiry) || !/^[a-f0-9]{32}$/.test(nonce)) return null;
  const expected = createHmac("sha256", config.secret).update(parts.slice(0, 3).join(".")).digest("hex");
  if (!safeEqual(signature, expected) || Number(editorId) !== config.editorId || Number(expiry) <= Math.floor(now / 1000)) return null;
  return config.editorId;
}
