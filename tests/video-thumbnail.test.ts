import assert from "node:assert/strict";
import { test } from "node:test";
import { thumbnailSource } from "../app/lib/video-thumbnail";
import { toProjectDto } from "../app/lib/presenters";

test("thumbnail source rejects traversal, other projects and invalid IDs", () => {
  assert.ok(thumbnailSource(10, "/uploads/projects/10/video.mp4"));
  for (const source of [null, "/uploads/projects/11/video.mp4", "/uploads/projects/10/../../secrets", "/uploads/projects/10/..\\..\\secrets", "/other/video.mp4"]) assert.equal(thumbnailSource(10, source), null);
  assert.equal(thumbnailSource(-1, "/uploads/projects/-1/video.mp4"), null);
});
test("project preview points to the selected latest version and empty projects have no image", () => {
  const project = { id: 10, name: "Projeto", description: null, status: "Em revisão", currentVersion: "03", progress: 0, client: { name: "Cliente" } };
  assert.equal(toProjectDto(project).thumbnailUrl, undefined);
  assert.equal(toProjectDto({ ...project, videoVersions: [{ id: 30, storagePath: "/uploads/projects/10/video.mp4" }] }).thumbnailUrl, "/api/projetos/10/versoes/30/miniatura");
  assert.equal(toProjectDto({ ...project, videoVersions: [{ id: 31, storagePath: null }] }).thumbnailUrl, undefined);
});
