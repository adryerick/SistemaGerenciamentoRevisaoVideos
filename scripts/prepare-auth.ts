import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { authDirectory, readAuthConfig } from "../app/lib/auth-core";

async function main() {
  if (await readAuthConfig()) {
    console.log("A conta já foi configurada. Entre com seu e-mail e senha.");
    return;
  }
  await mkdir(authDirectory, { recursive: true });
  const tokenFile = path.join(authDirectory, "setup-token");
  try { await writeFile(tokenFile, randomBytes(32).toString("hex"), { flag: "wx", mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  const token = (await readFile(tokenFile, "utf8")).trim();
  console.log(`Configure sua conta neste link local e não o compartilhe:\nhttp://localhost:3000/configurar?token=${token}`);
}
main().catch(() => { console.error("Não foi possível preparar a configuração local."); process.exitCode = 1; });
