import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import Database from "better-sqlite3";
import { backupData } from "../app/lib/data-backup";
import { convertVideoForBrowser, VideoConversionError } from "../app/lib/video-conversion";
import { parseVideoRange } from "../app/lib/video-range";
import { MAX_VIDEO_SIZE, validateVideoFile } from "../app/lib/video-formats";

const run = promisify(execFile);
const editorFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  if (process.env.VIDEO_TEST_COOKIE) headers.set("Cookie", process.env.VIDEO_TEST_COOKIE);
  if (process.env.VIDEO_TEST_BASE_URL) headers.set("Origin", process.env.VIDEO_TEST_BASE_URL);
  return fetch(input, { ...init, headers });
};

test("MP4 byte ranges support seeking and suffix requests", () => {
  assert.deepEqual(parseVideoRange("bytes=-10", 100), { start: 90, end: 99, partial: true });
  assert.deepEqual(parseVideoRange("bytes=10-", 100), { start: 10, end: 99, partial: true });
  assert.deepEqual(parseVideoRange("bytes=0-999", 100), { start: 0, end: 99, partial: true });
  assert.deepEqual(parseVideoRange(null, 100), { start: 0, end: 99, partial: false });
  for (const value of ["bytes=-", "bytes=-0", "bytes=100-", "bytes=20-10", "bytes=0-2,5-8"]) {
    assert.equal(parseVideoRange(value, 100), null);
  }
  assert.equal(parseVideoRange(null, 0), null);
});

test("uploads reject oversized, empty and unsupported files", () => {
  assert.equal(validateVideoFile("CapCut.MP4", 100), null);
  assert.ok(validateVideoFile("video.mp4", MAX_VIDEO_SIZE + 1));
  assert.ok(validateVideoFile("video.mp4", 0));
  assert.ok(validateVideoFile("document.html", 100));
});

test("video formats become decodable H.264/AAC with fast-start metadata", { timeout: 180000 }, async (t) => {
  assert.ok(ffmpegPath);
  const directory = await mkdtemp(path.join(tmpdir(), "videoreview-test-"));
  try {
    const cases = [
      { name: "h264", ext: "mp4", codec: "libx264", pixel: "yuv420p", audio: true },
      { name: "hevc10", ext: "mp4", codec: "libx265", pixel: "yuv420p10le", audio: true },
      { name: "webm", ext: "webm", codec: "libvpx-vp9", pixel: "yuv420p", audio: false },
      { name: "prores", ext: "mov", codec: "prores_ks", pixel: "yuv422p10le", audio: false },
    ];
    for (const sample of cases) {
      await t.test(sample.name, async () => {
        const input = path.join(directory, `${sample.name}.${sample.ext}`);
        const output = path.join(directory, `${sample.name}-web.mp4`);
        await run(ffmpegPath!, ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc2=size=160x90:rate=12",
          ...(sample.audio ? ["-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000"] : []),
          "-t", "1", "-c:v", sample.codec, "-pix_fmt", sample.pixel, "-threads", "2",
          ...(sample.codec === "libx265" ? ["-x265-params", "pools=1:log-level=error"] : []),
          ...(sample.audio ? ["-c:a", "aac"] : []), input], { windowsHide: true, timeout: 60000 });
        await convertVideoForBrowser(input, output);
        const decoded = await run(ffmpegPath!, ["-hide_banner", "-i", output, "-f", "null", "-"], { windowsHide: true });
        assert.match(decoded.stderr, /Video: h264/);
        assert.match(decoded.stderr, /yuv420p/);
        if (sample.audio) assert.match(decoded.stderr, /Audio: aac/);
        const bytes = await readFile(output);
        assert.ok(bytes.indexOf("moov") > 0 && bytes.indexOf("moov") < bytes.indexOf("mdat"));
      });
    }
    await t.test("corrupt input produces an actionable conversion error", async () => {
      const invalid = path.join(directory, "broken.mp4");
      await writeFile(invalid, "This is not a video.");
      await assert.rejects(convertVideoForBrowser(invalid, path.join(directory, "broken-output.mp4")), VideoConversionError);
    });

    const base = process.env.VIDEO_TEST_BASE_URL;
    if (base) {
      await t.test("real upload and public playback: HEVC, seeking, errors and disabled links", { timeout: 120000 }, async () => {
        let clientId: number | undefined;
        let duplicateClientId: number | undefined;
        let projectId: number | undefined;
        try {
          for (const body of ["not-json", "null", JSON.stringify({ name: "Teste", email: "invalido" }), JSON.stringify({ name: "x".repeat(121), email: "test@example.test" })]) {
            const invalidClient: Response = await editorFetch(`${base}/api/clients`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
            assert.equal(invalidClient.status, 400, "Malformed client input must not crash or create a client");
          }
          const clientResponse = await editorFetch(`${base}/api/clients`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `VideoTest-${Date.now()}`, email: `video-${Date.now()}@example.test` }),
          });
          assert.equal(clientResponse.status, 201);
          const client = await clientResponse.json();
          clientId = client.id;
          for (const body of ["not-json", "null", JSON.stringify({ name: "Teste", email: "invalido" })]) {
            assert.equal((await editorFetch(`${base}/api/clients/${clientId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body })).status, 400);
          }
          const duplicateResponse = await editorFetch(`${base}/api/clients`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: client.name, email: `duplicate-${Date.now()}@example.test` }),
          });
          assert.equal(duplicateResponse.status, 201);
          duplicateClientId = (await duplicateResponse.json()).id;
          const createProject = (body: unknown) => editorFetch(`${base}/api/projetos`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
          });
          assert.equal((await createProject({ name: "Ambiguous client", client: client.name })).status, 409);
          assert.equal((await createProject({ name: "Missing client" })).status, 400);
          assert.equal((await createProject({ name: "   ", clientId })).status, 400);
          assert.equal((await createProject({ name: "Invalid client", clientId: -1 })).status, 400);
          assert.equal((await createProject({ name: "Missing client", clientId: 2147483647 })).status, 404);
          const projectResponse = await editorFetch(`${base}/api/projetos`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Temporary compatibility test", clientId: client.id }),
          });
          assert.equal(projectResponse.status, 201);
          const project = await projectResponse.json();
          if (process.env.VIDEO_TEST_PROJECT_ID) assert.equal(project.id, Number(process.env.VIDEO_TEST_PROJECT_ID), "Refuse uploads/deletions outside reserved test project");
          projectId = project.id;
          const emptyDetails = await (await editorFetch(`${base}/projetos/${projectId}`)).text();
          const emptyReviewPath = emptyDetails.match(/\/revisao\/[a-z0-9]+/)?.[0];
          assert.ok(emptyReviewPath);
          const emptyReviewHtml = await (await fetch(`${base}${emptyReviewPath}`)).text();
          assert.match(emptyReviewHtml, /Verificar se o vídeo chegou/);
          const emptyActivity = await (await fetch(`${base}/api${emptyReviewPath}/atividade`)).json();
          const form = new FormData();
          form.append("video", new Blob([await readFile(path.join(directory, "hevc10.mp4"))], { type: "video/mp4" }), "CapCut-test.mp4");
          const uploaded = await editorFetch(`${base}/api/projetos/${projectId}/versoes`, { method: "POST", body: form });
          const uploadedBody = await uploaded.json();
          assert.equal(uploaded.status, 201, JSON.stringify(uploadedBody));
          const firstUploadActivity = await (await fetch(`${base}/api${emptyReviewPath}/atividade`)).json();
          assert.notEqual(firstUploadActivity.signature, emptyActivity.signature, "Empty review must detect the first uploaded video");
          const direct = await editorFetch(`${base}${uploadedBody.videoUrl}`);
          assert.equal(direct.status, 200);
          const uploadedBytes = Buffer.from(await direct.arrayBuffer());
          const uploadedPath = path.join(directory, "uploaded.mp4");
          await writeFile(uploadedPath, uploadedBytes);
          const inspected = await run(ffmpegPath!, ["-hide_banner", "-i", uploadedPath, "-f", "null", "-"], { windowsHide: true });
          assert.match(inspected.stderr, /Video: h264/);

          // A valid MP4 free atom keeps the sample playable while reproducing
          // uploads above Next Proxy's default 10 MB request-body buffer.
          const padding = Buffer.alloc(11 * 1024 * 1024);
          padding.writeUInt32BE(padding.length, 0);
          padding.write("free", 4, "ascii");
          const largeForm = new FormData();
          largeForm.append("video", new Blob([uploadedBytes, padding], { type: "video/mp4" }), "large-upload-regression.mp4");
          const largeUpload = await editorFetch(`${base}/api/projetos/${projectId}/versoes`, { method: "POST", body: largeForm });
          const largeResult = await largeUpload.json();
          assert.equal(largeUpload.status, 201, `Upload above 10 MB: ${JSON.stringify(largeResult)}`);
          assert.equal(largeResult.number, 2);
          const previewProjects = await (await editorFetch(`${base}/api/projetos`)).json();
          const preview = previewProjects.find((item: { id: number }) => item.id === projectId);
          assert.equal(preview.thumbnailUrl, `/api/projetos/${projectId}/versoes/${largeResult.id}/miniatura`);
          assert.equal((await fetch(`${base}${preview.thumbnailUrl}`)).status, 401);
          const imageResponse = await editorFetch(`${base}${preview.thumbnailUrl}`);
          assert.equal(imageResponse.status, 200);
          assert.match(imageResponse.headers.get("content-type")!, /image\/jpeg/);
          assert.match(imageResponse.headers.get("cache-control")!, /no-store/);
          const thumbnailBytes = Buffer.from(await imageResponse.arrayBuffer());
          assert.equal(thumbnailBytes.readUInt16BE(0), 0xffd8);
          assert.ok(thumbnailBytes.length < 100000);
          assert.deepEqual(Buffer.from(await (await editorFetch(`${base}${preview.thumbnailUrl}`)).arrayBuffer()), thumbnailBytes);
          assert.equal((await editorFetch(`${base}/api/projetos/2147483647/versoes/${largeResult.id}/miniatura`)).status, 404);
          assert.equal((await editorFetch(`${base}/api/projetos/${projectId}/versoes/2147483647/miniatura`)).status, 404);
          assert.equal((await editorFetch(`${base}${largeResult.videoUrl}`, { headers: { Range: "bytes=0-99" } })).status, 206);

          const details = await (await editorFetch(`${base}/projetos/${projectId}`)).text();
          const reviewPath = details.match(/\/revisao\/[a-z0-9]+/)?.[0];
          assert.ok(reviewPath && !reviewPath.endsWith("undefined"));
          assert.equal((await fetch(`${base}${reviewPath}`)).status, 200);
          const publicVideo = `${base}/api${reviewPath}/videos/${uploadedBody.id}`;
          const chunk = await fetch(publicVideo, { headers: { Range: "bytes=0-99" } });
          assert.equal(chunk.status, 206);
          assert.equal((await chunk.arrayBuffer()).byteLength, 100);
          const suffix = await fetch(publicVideo, { headers: { Range: "bytes=-10" } });
          assert.equal(suffix.status, 206);
          assert.deepEqual(Buffer.from(await suffix.arrayBuffer()), uploadedBytes.subarray(-10));
          assert.equal((await fetch(publicVideo, { headers: { Range: `bytes=${uploadedBytes.length}-` } })).status, 416);

          const feedbackUrl = `${base}/api${reviewPath}/solicitacoes`;
          const jsonHeaders = { "Content-Type": "application/json", Origin: base };
          assert.equal((await fetch(feedbackUrl, { method: "POST", headers: jsonHeaders, body: "not-json" })).status, 400);
          assert.equal((await fetch(feedbackUrl, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ comment: "Teste", videoVersionId: uploadedBody.id, timestamp: "00:99" }) })).status, 400);
          assert.equal((await fetch(feedbackUrl, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ comment: "Teste", videoVersionId: 2147483647 }) })).status, 404);
          const feedback = await fetch(feedbackUrl, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ comment: "Ajuste de cor do teste automatizado", videoVersionId: uploadedBody.id, timestamp: "0:00" }) });
          assert.equal(feedback.status, 201);
          const feedbackBody = await feedback.json();
          assert.equal(feedbackBody.timestamp, "00:00");
          assert.match(await (await fetch(`${base}${reviewPath}`)).text(), /Ajuste de cor do teste automatizado/);
          const editorReplies = `${base}/api/solicitacoes/${feedbackBody.id}/respostas`;
          const clientReplies = `${feedbackUrl}/${feedbackBody.id}/respostas`;
          const postJson = (url: string, body: unknown) => fetch(url, { method: "POST", headers: jsonHeaders, body: JSON.stringify(body) });
          assert.equal((await postJson(editorReplies, { comment: "Anonymous must not impersonate editor" })).status, 401);
          assert.equal((await editorFetch(editorReplies, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ comment: "Resposta do editor integrada", authorName: "Spoofed name" }) })).status, 201);
          assert.equal((await postJson(clientReplies, { comment: "Resposta do cliente integrada", authorName: "Cliente de teste", role: "Editor" })).status, 201);
          assert.equal((await postJson(clientReplies, { comment: "  " })).status, 400);
          assert.equal((await postJson(`${base}/api/revisao/wrong-token/solicitacoes/${feedbackBody.id}/respostas`, { comment: "Invalid link" })).status, 404);
          assert.equal((await postJson(`${feedbackUrl}/2147483647/respostas`, { comment: "Wrong request" })).status, 404);
          const conversation = await (await fetch(`${base}${reviewPath}`)).text();
          assert.match(conversation, /Resposta do editor integrada/);
          assert.match(conversation, /Resposta do cliente integrada/);
          assert.doesNotMatch(conversation, /Spoofed name/);
          const approvalUrl = `${base}/api${reviewPath}/aprovacao`;
          assert.equal((await postJson(approvalUrl, { videoVersionId: uploadedBody.id })).status, 409);
          assert.equal((await postJson(approvalUrl, { videoVersionId: largeResult.id, authorName: 1 })).status, 400);
          assert.equal((await postJson(approvalUrl, { videoVersionId: largeResult.id, authorName: "Cliente aprovador" })).status, 200);
          // Approval is idempotent and an additional adjustment reopens this version.
          assert.equal((await postJson(approvalUrl, { videoVersionId: largeResult.id })).status, 200);
          assert.match(await (await fetch(`${base}${reviewPath}`)).text(), /Cliente aprovador/);
          const latestFeedback = await postJson(feedbackUrl, { comment: "Ajuste depois da aprovação", videoVersionId: largeResult.id, timestamp: "00:00", authorName: "Cliente de teste" });
          assert.equal(latestFeedback.status, 201);
          const latestRequest = await latestFeedback.json();
          assert.equal(latestRequest.authorName, "Cliente de teste");
          assert.match(await (await fetch(`${base}${reviewPath}`)).text(), /Ajustes solicitados/);
          assert.equal((await postJson(approvalUrl, { videoVersionId: largeResult.id })).status, 409);
          assert.equal((await editorFetch(`${base}/api/solicitacoes/${latestRequest.id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ status: "Resolvido" }) })).status, 200);
          assert.equal((await postJson(approvalUrl, { videoVersionId: largeResult.id })).status, 200);
          assert.equal((await editorFetch(`${base}/api/solicitacoes/${latestRequest.id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ status: "Pendente" }) })).status, 200);
          assert.equal((await postJson(approvalUrl, { videoVersionId: largeResult.id })).status, 409);
          assert.equal((await editorFetch(`${base}/api/solicitacoes/${latestRequest.id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ status: "Resolvido" }) })).status, 200);
          const resolved = await editorFetch(`${base}/api/solicitacoes/${feedbackBody.id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ status: "Resolvido" }) });
          assert.equal(resolved.status, 200);
          assert.match(await (await fetch(`${base}${reviewPath}`)).text(), /Resolvido/);
          const edited = await editorFetch(`${base}/api/projetos/${projectId}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ name: "Projeto revisado", description: "Descrição atualizada", status: "Resolvido" }) });
          assert.equal(edited.status, 200);
          const projects = await (await editorFetch(`${base}/api/projetos`)).json();
          const updatedProject = projects.find((item: { id: number }) => item.id === projectId);
          assert.equal(updatedProject.name, "Projeto revisado");
          assert.equal(updatedProject.progress, 100);
          assert.equal((await editorFetch(`${base}/projetos/invalid`)).status, 404);
          assert.equal((await editorFetch(`${base}/projetos/2147483647`)).status, 404);

          assert.equal((await postJson(approvalUrl, { videoVersionId: largeResult.id })).status, 200);
          const nextVersion = new FormData();
          nextVersion.append("video", new Blob([uploadedBytes], { type: "video/mp4" }), "new-unapproved-version.mp4");
          const nextUpload = await editorFetch(`${base}/api/projetos/${projectId}/versoes`, { method: "POST", body: nextVersion });
          const nextResult = await nextUpload.json();
          assert.equal(nextUpload.status, 201, JSON.stringify(nextResult));
          assert.equal(nextResult.number, 3);
          assert.equal(nextResult.reviewStatus, "Em revisão", "New version must not inherit approval");
          assert.equal(nextResult.reviewedBy, undefined);
          assert.equal((await postJson(approvalUrl, { videoVersionId: largeResult.id })).status, 409);

          const asyncForm = new FormData();
          asyncForm.append("video", new Blob([uploadedBytes], { type: "video/mp4" }), "background-test.mp4");
          const asyncUpload = await editorFetch(`${base}/api/projetos/${projectId}/versoes`, { method: "POST", headers: { Prefer: "respond-async" }, body: asyncForm });
          assert.equal(asyncUpload.status, 202, await asyncUpload.clone().text());
          const asyncResult = await asyncUpload.json();
          assert.equal(typeof asyncResult.jobId, "string");
          const jobsUrl = `${base}/api/projetos/${projectId}/processamentos`;
          assert.equal((await fetch(jobsUrl)).status, 401);
          assert.equal((await editorFetch(`${base}/api/projetos/2147483647/processamentos`)).status, 404);
          let prepared: { id: string; status: string; versionId: number } | undefined;
          for (let attempt = 0; attempt < 60; attempt++) {
            const result = await (await editorFetch(jobsUrl)).json();
            prepared = result.jobs.find((job: { id: string }) => job.id === asyncResult.jobId);
            if (prepared?.status === "Pronto") break;
            assert.notEqual(prepared?.status, "Falhou", JSON.stringify(result));
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          assert.equal(prepared?.status, "Pronto");
          assert.equal((await fetch(`${base}/api${reviewPath}/videos/${prepared!.versionId}`)).status, 200);
          const brokenAsync = new FormData();
          brokenAsync.append("video", new Blob(["invalid"]), "async-broken.mp4");
          const brokenQueued = await editorFetch(`${base}/api/projetos/${projectId}/versoes`, { method: "POST", headers: { Prefer: "respond-async" }, body: brokenAsync });
          assert.equal(brokenQueued.status, 202);
          const brokenJob = await brokenQueued.json();
          async function waitForFailure() {
            for (let attempt = 0; attempt < 60; attempt++) {
              const result = await (await editorFetch(jobsUrl)).json();
              const job = result.jobs.find((item: { id: string }) => item.id === brokenJob.jobId);
              if (job?.status === "Falhou") { assert.match(job.error, /decodificar/); return; }
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            assert.fail("Invalid asynchronous upload must report a failure");
          }
          await waitForFailure();
          const retryBroken = await editorFetch(jobsUrl, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ jobId: brokenJob.jobId }) });
          assert.equal(retryBroken.status, 200);
          await waitForFailure();
          assert.equal((await editorFetch(jobsUrl, { method: "DELETE", headers: jsonHeaders, body: JSON.stringify({ jobId: brokenJob.jobId }) })).status, 200);
          assert.equal((await editorFetch(jobsUrl, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ jobId: asyncResult.jobId }) })).status, 409);
          const backup = await backupData();
          assert.ok(backup.startsWith(path.resolve(process.env.VIDEOREVIEW_DATA_DIR!, "backups")), "Backup must use isolated test directory");
          assert.equal(JSON.parse(await readFile(path.join(backup, "manifest.json"), "utf8")).complete, true);
          const snapshot = new Database(path.join(backup, "dev.db"), { readonly: true });
          try {
            const record = snapshot.prepare('SELECT "storagePath" FROM "VideoVersion" WHERE "id" = ?').get(prepared!.versionId) as { storagePath: string };
            const bytes = await readFile(path.join(backup, "uploads", record.storagePath.replace(/^\/uploads\//, "")));
            assert.ok(bytes.length > 0);
            assert.equal((snapshot.pragma("integrity_check") as { integrity_check: string }[])[0].integrity_check, "ok");
          } finally { snapshot.close(); }
          assert.equal(JSON.parse(await readFile(path.join(backup, "auth/auth.json"), "utf8")).email, "mvp@example.test");
          const priorityUpdated = await editorFetch(`${base}/api/solicitacoes/${latestRequest.id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ priority: "Alta" }) });
          assert.equal(priorityUpdated.status, 200); assert.equal((await priorityUpdated.json()).priority, "Alta");
          assert.equal((await editorFetch(`${base}/api/solicitacoes/${latestRequest.id}`, { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ priority: "Unknown" }) })).status, 400);
          assert.equal((await fetch(`${base}/api/atividade`)).status, 401);
          const beforeActivity = await (await fetch(`${base}/api${reviewPath}/atividade`)).json();
          assert.equal((await postJson(clientReplies, { comment: "Novo alerta de conversa" })).status, 201);
          const afterActivity = await (await fetch(`${base}/api${reviewPath}/atividade`)).json();
          assert.notEqual(beforeActivity.signature, afterActivity.signature);

          // Stop only the worker created by this isolated test harness.
          const workerPid = Number(process.env.VIDEO_TEST_WORKER_PID);
          const testDatabasePath = path.resolve(process.env.DATABASE_URL!.slice(5));
          assert.ok(testDatabasePath.startsWith(`${path.resolve(tmpdir())}${path.sep}videoreview-mvp-`));
          assert.ok(Number.isSafeInteger(workerPid) && workerPid > 0);
          if (process.platform === "win32") await run("taskkill", ["/PID", String(workerPid), "/T", "/F"], { windowsHide: true });
          else process.kill(workerPid, "SIGTERM");
          const interruptedId = randomUUID();
          const interruptedDirectory = path.join(process.env.VIDEOREVIEW_DATA_DIR!, "video-queue", interruptedId);
          await mkdir(interruptedDirectory, { recursive: true });
          await writeFile(path.join(interruptedDirectory, "input"), uploadedBytes);
          const isolatedDb = new Database(testDatabasePath);
          isolatedDb.prepare('UPDATE "WorkerState" SET "heartbeat" = 0 WHERE "id" = \'video-worker\'').run();
          isolatedDb.prepare('INSERT INTO "VideoJob" ("id", "projectId", "fileName", "status", "attempts", "updatedAt") VALUES (?, ?, ?, ?, ?, ?)').run(interruptedId, projectId, "interrupted-test.mp4", "Preparando", 1, Date.now());
          isolatedDb.close();
          const offlineForm = new FormData();
          offlineForm.append("video", new Blob([uploadedBytes]), "offline-test.mp4");
          assert.equal((await editorFetch(`${base}/api/projetos/${projectId}/versoes`, { method: "POST", headers: { Prefer: "respond-async" }, body: offlineForm })).status, 503);
          const restarted = spawn(process.execPath, ["--import", "tsx", "scripts/video-worker.ts"], { cwd: process.cwd(), env: process.env, windowsHide: true, stdio: "ignore" });
          try {
            let resumed: { status: string; attempts: number; versionId: number } | undefined;
            for (let attempt = 0; attempt < 100; attempt++) {
              const result = await (await editorFetch(jobsUrl)).json();
              resumed = result.jobs.find((job: { id: string }) => job.id === interruptedId);
              if (resumed?.status === "Pronto") break;
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            assert.equal(resumed?.status, "Pronto"); assert.equal(resumed?.attempts, 2);
            assert.equal((await fetch(`${base}/api${reviewPath}/videos/${resumed!.versionId}`)).status, 200);
            const snapshotAfterRestart = new Database(testDatabasePath, { readonly: true });
            try { assert.equal((snapshotAfterRestart.prepare('SELECT COUNT(*) AS count FROM "VideoVersion" WHERE "storagePath" LIKE ?').get(`%${interruptedId}%`) as { count: number }).count, 1); }
            finally { snapshotAfterRestart.close(); }
          } finally {
            if (process.platform === "win32" && restarted.pid) await run("taskkill", ["/PID", String(restarted.pid), "/T", "/F"], { windowsHide: true });
            else restarted.kill("SIGTERM");
          }

          // Deleting one version hides only its completed preparation, not other uploads.
          assert.equal((await editorFetch(`${base}/api/projetos/${projectId}/versoes`, { method: "DELETE", headers: jsonHeaders, body: JSON.stringify({ versionId: prepared!.versionId }) })).status, 200);
          const remainingJobs = await (await editorFetch(jobsUrl)).json();
          assert.equal(remainingJobs.jobs.some((job: { id: string }) => job.id === asyncResult.jobId), false);
          assert.equal(remainingJobs.jobs.some((job: { id: string }) => job.id === interruptedId), true);

          const corrupt = new FormData();
          corrupt.append("video", new Blob(["invalid"]), "broken.mp4");
          const rejected = await editorFetch(`${base}/api/projetos/${projectId}/versoes`, { method: "POST", body: corrupt });
          assert.equal(rejected.status, 422);
          assert.match((await rejected.json()).error, /decodificar/);
          const disabled = await editorFetch(`${base}/api/projetos/${projectId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewEnabled: false }),
          });
          assert.equal(disabled.status, 200);
          assert.equal((await fetch(publicVideo)).status, 404);
          assert.equal((await fetch(`${base}/api${reviewPath}/atividade`)).status, 404);
          assert.equal((await postJson(clientReplies, { comment: "Link disabled" })).status, 404);
          assert.equal((await postJson(approvalUrl, { videoVersionId: largeResult.id })).status, 404);
          assert.equal((await fetch(feedbackUrl, { method: "POST", headers: jsonHeaders, body: JSON.stringify({ comment: "Não deve aceitar", videoVersionId: uploadedBody.id }) })).status, 404);
          assert.equal((await fetch(`${base}${uploadedBody.videoUrl}`)).status, 401);
        } finally {
          if (projectId) assert.equal((await editorFetch(`${base}/api/projetos/${projectId}`, { method: "DELETE" })).status, 200);
          if (clientId) assert.equal((await editorFetch(`${base}/api/clients/${clientId}`, { method: "DELETE" })).status, 200);
          if (duplicateClientId) assert.equal((await editorFetch(`${base}/api/clients/${duplicateClientId}`, { method: "DELETE" })).status, 200);
        }
      });
    }
  } finally {
    // Only the unique temporary directory created by this test is removed.
    assert.ok(path.resolve(directory).startsWith(path.join(path.resolve(tmpdir()), "videoreview-test-")));
    await rm(directory, { recursive: true, force: true });
  }
});
