import { createHash, randomBytes } from "node:crypto";
import { open, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { authDirectory, authFile, hashPassword, readAuthConfig, safeEqual, type AuthConfig } from "./auth-core";

export const recoveryFile = path.join(authDirectory, "recovery.json");
export const fingerprint = (text: string) => createHash("sha256").update(text).digest("hex");
export type RecoveryGrant = { tokenHash: string; secretHash: string; expiresAt: number };

export function validRecovery(token: unknown, grant: RecoveryGrant | null, config: AuthConfig | null, now = Date.now()): boolean {
  return typeof token === "string" && /^[a-f0-9]{64}$/.test(token) && !!grant && !!config
    && typeof grant.tokenHash === "string" && typeof grant.secretHash === "string"
    && typeof config.secret === "string"
    && Number.isFinite(grant.expiresAt) && grant.expiresAt > now
    && safeEqual(fingerprint(token), grant.tokenHash)
    && safeEqual(fingerprint(config.secret), grant.secretHash);
}

export async function readRecovery(): Promise<RecoveryGrant | null> {
  try { return JSON.parse(await readFile(recoveryFile, "utf8")); }
  catch { return null; }
}

export async function recoverAccount(token: string, email: string, password: string): Promise<AuthConfig | null> {
  const lockFile = path.join(authDirectory, "recovery.lock");
  const lock = await open(lockFile, "wx").catch(() => null);
  if (!lock) return null;
  const temporary = path.join(authDirectory, `auth-${randomBytes(16).toString("hex")}.tmp`);
  try {
    const config = await readAuthConfig();
    if (!validRecovery(token, await readRecovery(), config)) return null;
    const updated = { ...config!, email, passwordHash: await hashPassword(password), secret: randomBytes(32).toString("hex") };
    await writeFile(temporary, JSON.stringify(updated), { flag: "wx", mode: 0o600 });
    await rename(temporary, authFile);
    // Secret rotation invalidates both previous sessions and this recovery grant.
    await rm(recoveryFile, { force: true }).catch(() => {});
    return updated;
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
    await lock.close();
    await rm(lockFile, { force: true });
  }
}
