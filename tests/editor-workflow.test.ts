import assert from "node:assert/strict";
import { test } from "node:test";
import { isPriority, sortRequests } from "../app/lib/request-priority";
import { comparisonTime, seekComparison } from "../app/lib/version-comparison";
import { jobDirectory, workerIsOnline } from "../app/lib/video-jobs";
import type { ChangeRequest } from "../app/types";

test("priority and checklist place unresolved high-priority requests first without changing the input", () => {
  const make = (id: number, status: ChangeRequest["status"], priority: ChangeRequest["priority"]): ChangeRequest => ({ id, projectId: 1, videoVersionId: 1, comment: "Teste", createdAt: "17/09/2026", status, priority });
  const input = [make(4, "Resolvido", "Alta"), make(3, "Pendente", "Baixa"), make(2, "Em andamento", "Alta"), make(1, "Pendente", "Normal")];
  assert.deepEqual(sortRequests(input).map((item) => item.id), [2, 1, 3, 4]);
  assert.deepEqual(input.map((item) => item.id), [4, 3, 2, 1]);
  assert.ok(isPriority("Alta")); assert.equal(isPriority("Urgente"), false); assert.equal(isPriority(null), false);
});
test("comparison pauses, preserves instants and clamps shorter videos including zero", () => {
  assert.equal(comparisonTime(5, 3), 3); assert.equal(comparisonTime(0, 3), 0);
  assert.equal(comparisonTime(-1, 3), 0); assert.equal(comparisonTime(NaN, 3), 0);
  let paused = false;
  const video = { duration: 3, currentTime: 2, pause() { paused = true; } };
  seekComparison(video as HTMLVideoElement, 0);
  assert.equal(video.currentTime, 0); assert.ok(paused);
});
test("jobs reject path traversal and workers expire after 30 seconds", () => {
  assert.throws(() => jobDirectory("../../secrets"));
  assert.throws(() => jobDirectory(""));
  assert.match(jobDirectory("12345678-1234-1234-1234-123456789abc"), /video-queue/);
  assert.ok(workerIsOnline(new Date(9999), 10000));
  assert.equal(workerIsOnline(new Date(0), 30000), false);
  assert.equal(workerIsOnline(new Date(20000), 10000), false);
  assert.equal(workerIsOnline(null), false);
});
