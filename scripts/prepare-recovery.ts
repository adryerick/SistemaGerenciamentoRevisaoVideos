import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { readAuthConfig } from "../app/lib/auth-core";
import { fingerprint, recoveryFile } from "../app/lib/auth-recovery";

async function main() {
  const config = await readAuthConfig();
  if (!config) throw new Error("Nenhuma conta configurada. Use npm run auth:prepare.");
  const token = randomBytes(32).toString("hex");
  await writeFile(recoveryFile, JSON.stringify({ tokenHash: fingerprint(token), secretHash: fingerprint(config.secret), expiresAt: Date.now() + 30 * 60 * 1000 }), { mode: 0o600 });
  const origin = process.env.APP_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000";
  console.log(`Link de recuperação, válido por 30 minutos. Não compartilhe:\n${new URL(`/recuperar?token=${token}`, origin)}\nA senha atual não foi alterada.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
