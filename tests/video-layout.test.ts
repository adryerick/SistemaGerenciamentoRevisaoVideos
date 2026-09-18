import assert from "node:assert/strict";
import { test } from "node:test";
import { videoAspectRatio, videoLayout } from "../app/lib/video-layout";

test("player follows portrait, landscape and square frames without cropping", () => {
  assert.equal(videoAspectRatio(1080, 1920), 9 / 16);
  assert.equal(videoAspectRatio(1920, 1080), 16 / 9);
  assert.equal(videoAspectRatio(1080, 1080), 1);
  assert.deepEqual(videoLayout(9 / 16), { width: "min(100%, 39.375vh)", aspectRatio: "0.5625" });
});

test("layout falls back safely before metadata and rejects invalid dimensions", () => {
  for (const [width, height] of [[0, 0], [1920, 0], [-1080, 1920], [NaN, 1080], [Infinity, 1080]]) {
    assert.equal(videoAspectRatio(width, height), 16 / 9);
  }
});
