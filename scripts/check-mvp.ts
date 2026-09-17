import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

async function main() {
  const root = process.cwd();
  const temporary = await mkdtemp(path.join(tmpdir(), "videoreview-mvp-"));
  const databaseFile = path.join(temporary, "test.db");
  const authDir = path.join(temporary, "auth");
  await mkdir(authDir);
  const setupToken = randomBytes(32).toString("hex");
  await writeFile(path.join(authDir, "setup-token"), setupToken);
  const database = new Database(databaseFile);
  for (const migration of (await readdir(path.join(root, "prisma/migrations"), { withFileTypes: true })).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    database.exec(await readFile(path.join(root, "prisma/migrations", migration.name, "migration.sql"), "utf8"));
  }
  // The Next public folder is shared with the local app. Reserve a fresh, high
  // project ID and verify its upload directory does not exist before any tests.
  const testProjectId = randomInt(1000000000, 2000000000);
  const uploadTarget = path.resolve(root, "public/uploads/projects", String(testProjectId));
  assert.equal(await access(uploadTarget).then(() => true, () => false), false, "Test upload path must not already exist");
  database.prepare("DELETE FROM sqlite_sequence WHERE name = 'Project'").run();
  database.prepare("INSERT INTO sqlite_sequence (name, seq) VALUES ('Project', ?)").run(testProjectId - 1);
  assert.equal((database.prepare("SELECT seq FROM sqlite_sequence WHERE name = 'Project'").get() as { seq: number }).seq, testProjectId - 1);
  database.close();
  const port = 3107;
  // A separate hostname keeps browser test cookies apart from localhost:3000.
  const base = `http://127.0.0.1:${port}`;
  const env = { ...process.env, DATABASE_URL: `file:${databaseFile}`, VIDEOREVIEW_AUTH_DIR: authDir, NEXT_DIST_DIR: ".next-test", NEXT_TELEMETRY_DISABLED: "1" };
  let logs = "";
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", String(port)], { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (data) => { logs = (logs + data).slice(-16000); });
  server.stderr.on("data", (data) => { logs = (logs + data).slice(-16000); });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 90; attempt++) {
      if (server.exitCode !== null) throw new Error(`Test server exited: ${logs}`);
      try { ready = (await fetch(`${base}/`, { signal: AbortSignal.timeout(3000) })).ok; } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    assert.ok(ready, `Test server did not start: ${logs}`);
    const setup = await fetch(`${base}/api/auth/setup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: setupToken, name: "Editor de teste", email: "mvp@example.test", password: "MVP-test-password-2026" }) });
    assert.equal(setup.status, 200, await setup.clone().text());
    const login = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "mvp@example.test", password: "MVP-test-password-2026" }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    assert.match(login.headers.get("set-cookie")!, /HttpOnly/i);
    if (process.argv.includes("--check-forms")) {
      assert.ok(process.stdin.isTTY, "Use --check-forms em um terminal interativo.");
      const fixture = await fetch(`${base}/api/clients`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({ name: "Cliente de teste do formulário", email: "forms@example.test" }) });
      assert.equal(fixture.status, 201);
      console.log(`Conferência de formulários em ${base}. Conta APENAS de teste: mvp@example.test / MVP-test-password-2026`);
      console.log("Teste login e cadastro de projeto (sem uploads). Pressione Enter neste terminal para encerrar e remover o banco temporário.");
      await new Promise<void>((resolve) => { process.stdin.resume(); process.stdin.once("data", () => { process.stdin.pause(); resolve(); }); });
      return;
    }
    const testFiles = (await readdir(path.join(root, "tests"))).filter((file) => file.endsWith(".test.ts")).map((file) => `tests/${file}`);
    const testProcess = spawn(process.execPath, ["--import", "tsx", "--test", ...testFiles], { cwd: root, env: { ...env, VIDEO_TEST_BASE_URL: base, VIDEO_TEST_COOKIE: cookie, VIDEO_TEST_PROJECT_ID: String(testProjectId) }, windowsHide: true, stdio: "inherit" });
    const exitCode = await new Promise<number>((resolve, reject) => { testProcess.on("error", reject); testProcess.on("exit", (code) => resolve(code ?? 1)); });
    if (exitCode) { console.error(logs); process.exitCode = exitCode; }
    else {
      // Run last: recovery rotates this isolated editor's secret, invalidating
      // the cookie used by the concurrent API tests above. Never use real auth.
      const originalAuth = JSON.parse(await readFile(path.join(authDir, "auth.json"), "utf8"));
      const recoveryToken = randomBytes(32).toString("hex");
      const fingerprint = (value: string) => createHash("sha256").update(value).digest("hex");
      await writeFile(path.join(authDir, "recovery.json"), JSON.stringify({ tokenHash: fingerprint(recoveryToken), secretHash: fingerprint(originalAuth.secret), expiresAt: Date.now() + 60000 }));
      const recover = (token: string, confirmPassword = "Recovered-test-password-2026") => fetch(`${base}/api/auth/recover`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: "recovered@example.test", password: "Recovered-test-password-2026", confirmPassword }),
      });
      assert.equal((await recover(recoveryToken, "mismatch")).status, 400);
      assert.equal((await recover("f".repeat(64))).status, 403);
      const recovered = await recover(recoveryToken);
      assert.equal(recovered.status, 200, await recovered.clone().text());
      const newCookie = recovered.headers.get("set-cookie")?.split(";")[0];
      assert.ok(newCookie);
      assert.equal((await recover(recoveryToken)).status, 403);
      assert.equal((await fetch(`${base}/api/projetos`, { headers: { Cookie: cookie } })).status, 401);
      assert.equal((await fetch(`${base}/api/projetos`, { headers: { Cookie: newCookie } })).status, 200);
      const newAuth = JSON.parse(await readFile(path.join(authDir, "auth.json"), "utf8"));
      assert.equal(newAuth.editorId, originalAuth.editorId);
      assert.notEqual(newAuth.secret, originalAuth.secret);
      const tryLogin = (email: string, password: string) => fetch(`${base}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
      });
      assert.equal((await tryLogin("mvp@example.test", "MVP-test-password-2026")).status, 401);
      assert.equal((await tryLogin("recovered@example.test", "Recovered-test-password-2026")).status, 200);
      console.log("✔ Recuperação local: troca de acesso, uso único, sessões antigas invalidadas e ID preservado.");
    }
  } finally {
    if (server.exitCode === null) {
      // Windows Next dev launches a child; stop only the process tree we created.
      if (process.platform === "win32" && server.pid) {
        const stop = spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
        await new Promise((resolve) => stop.on("exit", resolve));
      } else server.kill();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    assert.ok(path.resolve(temporary).startsWith(`${path.resolve(tmpdir())}${path.sep}videoreview-mvp-`));
    await rm(temporary, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
