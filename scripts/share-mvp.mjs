import { spawn } from "node:child_process";
import { access, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";

const root = process.cwd();
const port = 3001;
const children = new Set();
const next = "node_modules/next/dist/bin/next";
const env = { ...process.env, NEXT_DIST_DIR: ".next-public", NEXT_TELEMETRY_DISABLED: "1" };
let stopping = false;

function launch(executable, args, options = {}) {
  const child = spawn(executable, args, { cwd: root, env, windowsHide: true, ...options });
  children.add(child);
  child.once("exit", () => children.delete(child));
  return child;
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    } else child.kill("SIGTERM");
  }
  process.exitCode = code;
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

try {
  await access(path.join(process.env.VIDEOREVIEW_AUTH_DIR ?? path.join(root, ".local"), "auth.json"));
  const cloudflared = process.env.CLOUDFLARED_PATH ?? path.join(root, ".local", process.platform === "win32" ? "cloudflared.exe" : "cloudflared");
  await access(cloudflared);
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  });
  console.log("Preparando a versão pública de produção...");
  await new Promise((resolve, reject) => {
    const build = launch(process.execPath, [next, "build"], { stdio: "inherit" });
    build.once("error", reject);
    build.once("exit", (code) => code === 0 ? resolve() : reject(new Error("A compilação falhou.")));
  });
  if (stopping) throw new Error("Compartilhamento interrompido.");
  const tunnel = launch(cloudflared, ["tunnel", "--url", `http://127.0.0.1:${port}`, "--no-autoupdate"], { stdio: ["ignore", "pipe", "pipe"] });
  let tunnelLogs = "";
  const publicUrl = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`O túnel não gerou um link. ${tunnelLogs.slice(-1500)}`)), 45000);
    const collect = (data) => {
      tunnelLogs = (tunnelLogs + data).slice(-6000);
      const url = tunnelLogs.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
      if (url) { clearTimeout(timeout); resolve(url); }
    };
    tunnel.stdout.on("data", collect);
    tunnel.stderr.on("data", collect);
    tunnel.once("error", (error) => { clearTimeout(timeout); reject(error); });
    tunnel.once("exit", () => { clearTimeout(timeout); reject(new Error("O túnel foi encerrado.")); });
  });
  const server = launch(process.execPath, [next, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    env: { ...env, NODE_ENV: "production", APP_URL: publicUrl }, stdio: "inherit",
  });
  server.once("error", (error) => { console.error(error.message); stop(1); });
  server.once("exit", () => { if (!stopping) { console.error("O servidor público foi encerrado."); stop(1); } });
  tunnel.once("exit", () => { if (!stopping) { console.error("O túnel foi encerrado."); stop(1); } });
  let ready = false;
  for (let attempt = 0; attempt < 20 && !stopping; attempt++) {
    try { ready = (await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(2000) })).ok; } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error("O servidor não ficou disponível.");
  await writeFile(path.join(root, ".local", "quick-tunnel.json"), JSON.stringify({ url: publicUrl, serverPid: server.pid, tunnelPid: tunnel.pid, startedAt: new Date().toISOString() }));
  console.log(`\nLINK PÚBLICO: ${publicUrl}\nEntre por esse endereço para copiar os links de revisão com o domínio público.\nMantenha este terminal e o computador ligados. Ctrl+C encerra apenas estes processos.\n`);
} catch (error) {
  console.error(error.message);
  console.error("Use o cliente cloudflared oficial em .local/cloudflared.exe, ou defina CLOUDFLARED_PATH. A porta 3001 deve estar livre.");
  stop(1);
}
