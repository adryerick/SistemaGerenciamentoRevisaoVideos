import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import { convertVideoForBrowser, VideoConversionError } from "../app/lib/video-conversion";
import { parseVideoRange } from "../app/lib/video-range";
import { MAX_VIDEO_SIZE, validateVideoFile } from "../app/lib/video-formats";

const run = promisify(execFile);

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
        let projectId: number | undefined;
        try {
          const clientResponse = await fetch(`${base}/api/clients`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `VideoTest-${Date.now()}`, email: `video-${Date.now()}@example.test` }),
          });
          assert.equal(clientResponse.status, 201);
          const client = await clientResponse.json();
          clientId = client.id;
          const projectResponse = await fetch(`${base}/api/projetos`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Temporary compatibility test", client: client.name }),
          });
          assert.equal(projectResponse.status, 201);
          const project = await projectResponse.json();
          projectId = project.id;
          const form = new FormData();
          form.append("video", new Blob([await readFile(path.join(directory, "hevc10.mp4"))], { type: "video/mp4" }), "CapCut-test.mp4");
          const uploaded = await fetch(`${base}/api/projetos/${projectId}/versoes`, { method: "POST", body: form });
          const uploadedBody = await uploaded.json();
          assert.equal(uploaded.status, 201, JSON.stringify(uploadedBody));
          const direct = await fetch(`${base}${uploadedBody.videoUrl}`);
          assert.equal(direct.status, 200);
          const uploadedBytes = Buffer.from(await direct.arrayBuffer());
          const uploadedPath = path.join(directory, "uploaded.mp4");
          await writeFile(uploadedPath, uploadedBytes);
          const inspected = await run(ffmpegPath!, ["-hide_banner", "-i", uploadedPath, "-f", "null", "-"], { windowsHide: true });
          assert.match(inspected.stderr, /Video: h264/);

          const details = await (await fetch(`${base}/projetos/${projectId}`)).text();
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

          const corrupt = new FormData();
          corrupt.append("video", new Blob(["invalid"]), "broken.mp4");
          const rejected = await fetch(`${base}/api/projetos/${projectId}/versoes`, { method: "POST", body: corrupt });
          assert.equal(rejected.status, 422);
          assert.match((await rejected.json()).error, /decodificar/);
          const disabled = await fetch(`${base}/api/projetos/${projectId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewEnabled: false }),
          });
          assert.equal(disabled.status, 200);
          assert.equal((await fetch(publicVideo)).status, 404);
        } finally {
          if (projectId) assert.equal((await fetch(`${base}/api/projetos/${projectId}`, { method: "DELETE" })).status, 200);
          if (clientId) assert.equal((await fetch(`${base}/api/clients/${clientId}`, { method: "DELETE" })).status, 200);
        }
      });
    }
  } finally {
    // Only the unique temporary directory created by this test is removed.
    assert.ok(path.resolve(directory).startsWith(path.join(path.resolve(tmpdir()), "videoreview-test-")));
    await rm(directory, { recursive: true, force: true });
  }
});
