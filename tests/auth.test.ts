import assert from "node:assert/strict";
import { test } from "node:test";
import { createSession, hashPassword, SESSION_SECONDS, verifyPassword, verifySession } from "../app/lib/auth-core";
import { fingerprint, validRecovery, type RecoveryGrant } from "../app/lib/auth-recovery";

test("recovery rejects expired, malformed, reused and unrelated grants", () => {
  const token = "a".repeat(64);
  const config = { editorId: 4, email: "test@example.test", passwordHash: "not-used", secret: "test-only-secret" };
  const grant = { tokenHash: fingerprint(token), secretHash: fingerprint(config.secret), expiresAt: 2000 };
  assert.equal(validRecovery(token, grant, config, 1000), true);
  assert.equal(validRecovery(token, grant, config, 2000), false);
  assert.equal(validRecovery("b".repeat(64), grant, config, 1000), false);
  assert.equal(validRecovery(token, grant, { ...config, secret: "rotated" }, 1000), false);
  assert.equal(validRecovery(token, {} as RecoveryGrant, config, 1000), false);
  assert.equal(validRecovery(token, { expiresAt: 2000 } as RecoveryGrant, config, 1000), false);
  assert.equal(validRecovery(token, null, config, 1000), false);
});

test("password hashes use independent salts and verify correct password only", async () => {
  const hash = await hashPassword("Example-test-password");
  assert.notEqual(hash, await hashPassword("Example-test-password"));
  assert.ok(await verifyPassword("Example-test-password", hash));
  assert.equal(await verifyPassword("wrong-password", hash), false);
  assert.equal(await verifyPassword("x".repeat(129), hash), false);
});

test("signed sessions reject tampering, expiry and another secret or editor", () => {
  const config = { editorId: 4, email: "test@example.test", passwordHash: "not-used", secret: "test-only-secret" };
  const now = 100000;
  const token = createSession(config, now);
  assert.equal(verifySession(token, config, now), 4);
  assert.equal(verifySession(token.replace(/^4\./, "5."), config, now), null);
  assert.equal(verifySession(token, config, now + SESSION_SECONDS * 1000), null);
  assert.equal(verifySession(token, { ...config, secret: "other" }, now), null);
  assert.equal(verifySession(token, { ...config, editorId: 7 }, now), null);
  assert.equal(verifySession("arbitrary", config), null);
  assert.equal(verifySession(undefined, config), null);
});

test("protected routes deny anonymous users and login rejects invalid credentials", { skip: !process.env.VIDEO_TEST_BASE_URL }, async () => {
  const base = process.env.VIDEO_TEST_BASE_URL!;
  assert.equal((await fetch(`${base}/api/projetos`)).status, 401);
  assert.equal((await fetch(`${base}/api/clients`)).status, 401);
  assert.equal((await fetch(`${base}/uploads/projects/1/nonexistent.mp4`)).status, 401);
  assert.equal((await fetch(`${base}/dashboard`, { redirect: "manual" })).status, 307);
  assert.equal((await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "test@example.test", password: "incorrect" }) })).status, 401);
  assert.equal((await fetch(`${base}/api/projetos`, { method: "POST", headers: { "Cookie": process.env.VIDEO_TEST_COOKIE!, "Origin": "https://untrusted.example", "Content-Type": "application/json" }, body: "{}" })).status, 403);
  const logout = await fetch(`${base}/api/auth/logout`, { method: "POST" });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/i);
});
