import assert from "node:assert/strict";
import { test } from "node:test";
import { publicOrigin } from "../app/lib/public-origin";

test("public HTTPS origin stays correct behind an internal HTTP proxy", () => {
  const appUrl = process.env.APP_URL;
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  try {
    delete process.env.APP_URL;
    process.env.RENDER_EXTERNAL_URL = "https://videoreview.example.test";
    assert.equal(publicOrigin("http://localhost:10000/api/auth/login"), "https://videoreview.example.test");
    process.env.APP_URL = "https://custom.example.test";
    assert.equal(publicOrigin("http://localhost:10000/api/auth/login"), "https://custom.example.test");
    delete process.env.APP_URL;
    delete process.env.RENDER_EXTERNAL_URL;
    assert.equal(publicOrigin("http://127.0.0.1:3107/api/auth/login"), "http://127.0.0.1:3107");
  } finally {
    if (appUrl === undefined) delete process.env.APP_URL; else process.env.APP_URL = appUrl;
    if (renderUrl === undefined) delete process.env.RENDER_EXTERNAL_URL; else process.env.RENDER_EXTERNAL_URL = renderUrl;
  }
});
