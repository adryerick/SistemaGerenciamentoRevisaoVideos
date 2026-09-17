import assert from "node:assert/strict";
import { test } from "node:test";
import { formatTimestamp, parseTimestamp, validateReviewInput } from "../app/lib/review-feedback";
import { toProjectDto } from "../app/lib/presenters";
import { seekToTimestamp } from "../app/lib/video-navigation";

test("timestamps normalize valid values and reject malformed input", () => {
  assert.equal(parseTimestamp("00:23"), 23);
  assert.equal(parseTimestamp("1:02:03"), 3723);
  assert.equal(parseTimestamp("90:00"), 5400);
  for (const text of ["", "-00:10", "00:60", "1:70:00", "abc", "0", "12:34:56:78"]) assert.equal(parseTimestamp(text), null);
  assert.equal(formatTimestamp(3723.9), "01:02:03");
  assert.equal(formatTimestamp(0), "00:00");
  assert.equal(formatTimestamp(Infinity), "00:00");
});

test("feedback validates comment, numeric version and optional timestamp", () => {
  assert.deepEqual(validateReviewInput({ comment: "  Ajustar cor  ", videoVersionId: 1, timestamp: "0:23" }), { comment: "Ajustar cor", videoVersionId: 1, timestamp: "00:23" });
  assert.deepEqual(validateReviewInput({ comment: "Texto", videoVersionId: 1 }), { comment: "Texto", videoVersionId: 1, timestamp: null });
  for (const body of [null, [], {}, { comment: "  ", videoVersionId: 1 }, { comment: "x".repeat(2001), videoVersionId: 1 }, { comment: "a", videoVersionId: "1" }, { comment: "a", videoVersionId: 0 }, { comment: "a", videoVersionId: 1, timestamp: 23 }, { comment: "a", videoVersionId: 1, timestamp: "00:99" }]) assert.ok("error" in validateReviewInput(body));
});

test("project progress follows resolved requests, not mock progress", () => {
  const project = { id: 1, name: "Projeto", description: null, status: "Em revisão", currentVersion: "01", progress: 99, client: { name: "Cliente" } };
  assert.equal(toProjectDto({ ...project, changeRequests: [] }).progress, 0);
  assert.equal(toProjectDto({ ...project, changeRequests: [{ status: "Pendente" }, { status: "Resolvido" }] }).progress, 50);
  assert.equal(toProjectDto({ ...project, changeRequests: [{ status: "Resolvido" }] }).progress, 100);
});

test("timestamp navigation pauses the correct player and clamps to duration", () => {
  let paused = false;
  const video = { readyState: 1, duration: 30, currentTime: 0, pause() { paused = true; }, scrollIntoView() {}, focus() {} };
  seekToTimestamp(video as HTMLVideoElement, "00:23");
  assert.equal(video.currentTime, 23);
  assert.equal(paused, true);
  seekToTimestamp(video as HTMLVideoElement, "02:00");
  assert.equal(video.currentTime, 30);
  seekToTimestamp(video as HTMLVideoElement, "invalid");
  assert.equal(video.currentTime, 30);
});

test("timestamp navigation waits for metadata before seeking", () => {
  let callback: (() => void) | undefined;
  const video = { readyState: 0, duration: 20, currentTime: 0, pause() {}, scrollIntoView() {}, focus() {}, addEventListener(_name: string, listener: () => void) { callback = listener; } };
  seekToTimestamp(video as unknown as HTMLVideoElement, "00:05");
  assert.equal(video.currentTime, 0);
  assert.ok(callback);
  callback();
  assert.equal(video.currentTime, 5);
});
