import assert from "node:assert/strict";
import { test } from "node:test";
import { timelineMarkers, validateReply, validateReviewerName } from "../app/lib/review-collaboration";

test("reviewer identification is optional, trimmed and length limited", () => {
  assert.deepEqual(validateReviewerName(undefined), { name: null });
  assert.deepEqual(validateReviewerName("   "), { name: null });
  assert.deepEqual(validateReviewerName("  Cliente  "), { name: "Cliente" });
  for (const name of [false, {}, 1, "a".repeat(81)]) assert.ok("error" in validateReviewerName(name));
});

test("replies reject malformed, empty and oversized messages", () => {
  assert.deepEqual(validateReply({ comment: " Ajuste realizado ", authorName: " Cliente " }), { comment: "Ajuste realizado", name: "Cliente" });
  for (const input of [null, [], {}, { comment: " " }, { comment: 1 }, { comment: "a".repeat(2001) }, { comment: "ok", authorName: 1 }]) assert.ok("error" in validateReply(input));
});

test("timeline sorts markers, retains duplicate instants and ignores invalid or out-of-range timestamps", () => {
  const requests = [{ id: 2, timestamp: "00:10" }, { id: 4, timestamp: "00:00" }, { id: 1, timestamp: "00:10" }, { id: 5 }, { id: 6, timestamp: "99:00" }, { id: 7, timestamp: "invalid" }];
  const markers = timelineMarkers(requests, 20);
  assert.deepEqual(markers.map((marker) => [marker.id, marker.seconds, marker.percentage]), [[4, 0, 0], [1, 10, 50], [2, 10, 50]]);
  assert.deepEqual(timelineMarkers(requests, 0), []);
  assert.deepEqual(timelineMarkers(requests, Infinity), []);
});
