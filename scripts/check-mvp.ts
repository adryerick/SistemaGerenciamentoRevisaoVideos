import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";

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
  const env = { ...process.env, APP_URL: base, DATABASE_URL: `file:${databaseFile}`, VIDEOREVIEW_AUTH_DIR: authDir, VIDEOREVIEW_DATA_DIR: path.join(temporary, "data"), VIDEOREVIEW_BACKUP_DISABLED: "1", NEXT_DIST_DIR: ".next-test", NEXT_TELEMETRY_DISABLED: "1" };
  const production = process.argv.includes("--production");
  if (production) {
    const build = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build"], { cwd: root, env, windowsHide: true, stdio: "inherit" });
    const code = await new Promise((resolve, reject) => { build.once("error", reject); build.once("exit", resolve); });
    if (code !== 0) {
      assert.ok(path.resolve(temporary).startsWith(`${path.resolve(tmpdir())}${path.sep}videoreview-mvp-`));
      await rm(temporary, { recursive: true, force: true });
    }
    assert.equal(code, 0, "Production test build must succeed");
  }
  let logs = "";
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", production ? "start" : "dev", "--port", String(port)], { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (data) => { logs = (logs + data).slice(-16000); });
  server.stderr.on("data", (data) => { logs = (logs + data).slice(-16000); });
  let reviewFixture: { id: number; cookie: string } | undefined;
  const worker = spawn(process.execPath, ["--import", "tsx", "scripts/video-worker.ts"], { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  worker.stdout.on("data", (data) => { logs = (logs + data).slice(-16000); });
  worker.stderr.on("data", (data) => { logs = (logs + data).slice(-16000); });
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
    for (let attempt = 0; attempt < 30; attempt++) {
      const activity = await (await fetch(`${base}/api/atividade`, { headers: { Cookie: cookie } })).json();
      if (activity.online) break;
      assert.ok(attempt < 29, `Test worker did not start: ${logs}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (process.argv.includes("--check-review") || process.argv.includes("--check-thumbnails")) {
      assert.ok(process.stdin.isTTY && ffmpegPath, "Use --check-review em um terminal interativo com FFmpeg instalado.");
      const headers = { Cookie: cookie, "Content-Type": "application/json" };
      const clientResponse = await fetch(`${base}/api/clients`, { method: "POST", headers, body: JSON.stringify({ name: "Cliente de revisão visual", email: "review@example.test" }) });
      assert.equal(clientResponse.status, 201);
      const client = await clientResponse.json();
      const projectResponse = await fetch(`${base}/api/projetos`, { method: "POST", headers, body: JSON.stringify({ name: "Conferência visual da revisão", clientId: client.id, description: "Dados isolados de teste; não modifica os projetos reais." }) });
      assert.equal(projectResponse.status, 201);
      const project = await projectResponse.json();
      assert.equal(project.id, testProjectId);
      reviewFixture = { id: project.id, cookie };
      const sample = path.join(temporary, "sample.mp4");
      await promisify(execFile)(ffmpegPath!, ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=24", "-t", "3", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-threads", "2", sample], { windowsHide: true });
      for (let index = 1; index <= 2; index++) {
        const form = new FormData();
        form.append("video", new Blob([await readFile(sample)], { type: "video/mp4" }), `Teste-visual-${index}.mp4`);
        const upload: Response = await fetch(`${base}/api/projetos/${project.id}/versoes`, { method: "POST", headers: { Cookie: cookie }, body: form });
        assert.equal(upload.status, 201, await upload.clone().text());
        const version = await upload.json();
        const feedback = await fetch(`${base}/api/projetos/${project.id}/solicitacoes`, { method: "POST", headers, body: JSON.stringify({ comment: `Conferir o ajuste da versão ${index}`, videoVersionId: version.id, timestamp: "00:01" }) });
        assert.equal(feedback.status, 201);
        const request = await feedback.json();
        assert.equal((await fetch(`${base}/api/solicitacoes/${request.id}/respostas`, { method: "POST", headers, body: JSON.stringify({ comment: "Ajuste conferido pelo editor de teste." }) })).status, 201);
        if (index === 2) {
          assert.equal((await fetch(`${base}/api/solicitacoes/${request.id}`, { method: "PATCH", headers, body: JSON.stringify({ status: "Resolvido" }) })).status, 200);
        }
      }
      const html = await (await fetch(`${base}/projetos/${project.id}`, { headers: { Cookie: cookie } })).text();
      const reviewPath = html.match(/\/revisao\/[a-z0-9]+/)?.[0];
      assert.ok(reviewPath);
      console.log(`REVISÃO VISUAL ISOLADA: ${base}${reviewPath}`);
      if (process.argv.includes("--check-thumbnails")) console.log(`MINIATURAS ISOLADAS: ${base}/projetos. Conta APENAS de teste: mvp@example.test / MVP-test-password-2026`);
      console.log("Confira apenas esta revisão pública. Pressione Enter para remover os vídeos e o banco exclusivos de teste.");
      await new Promise<void>((resolve) => { process.stdin.resume(); process.stdin.once("data", () => { process.stdin.pause(); resolve(); }); });
      return;
    }
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
    const testProcess = spawn(process.execPath, ["--import", "tsx", "--test", ...testFiles], { cwd: root, env: { ...env, VIDEO_TEST_BASE_URL: base, VIDEO_TEST_COOKIE: cookie, VIDEO_TEST_PROJECT_ID: String(testProjectId), VIDEO_TEST_WORKER_PID: String(worker.pid) }, windowsHide: true, stdio: "inherit" });
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
    if (worker.exitCode === null) {
      if (process.platform === "win32" && worker.pid) {
        const stopWorker = spawn("taskkill", ["/PID", String(worker.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
        await new Promise((resolve) => stopWorker.once("exit", resolve));
      } else worker.kill();
    }
    if (reviewFixture) {
      assert.equal(reviewFixture.id, testProjectId);
      assert.equal((await fetch(`${base}/api/projetos/${reviewFixture.id}`, { method: "DELETE", headers: { Cookie: reviewFixture.cookie } })).status, 200);
    }
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
