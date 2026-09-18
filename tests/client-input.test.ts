import assert from "node:assert/strict";
import { test } from "node:test";
import { validateClientInput } from "../app/lib/client-input";

test("client input rejects missing, malformed and non-object fields", () => {
  for (const value of [null, undefined, "invalid", [], 3, {}, { name: " ", email: "client@example.test" }, { name: "Client", email: " " }, { name: 12, email: "client@example.test" }, { name: "Client", email: 12 }]) {
    assert.ok("error" in validateClientInput(value));
  }
});

test("client input normalizes valid fields and enforces name and email limits", () => {
  assert.deepEqual(validateClientInput({ name: "  Cliente de teste  ", email: "  CLIENT@EXAMPLE.TEST  " }), {
    name: "Cliente de teste", email: "client@example.test",
  });
  const name = "a".repeat(120);
  const email = `${"a".repeat(240)}@example.test`;
  assert.equal(email.length, 253);
  assert.deepEqual(validateClientInput({ name, email: `a${email}` }), { name, email: `a${email}` });
  for (const invalid of [
    { name: `${name}a`, email },
    { name, email: `aa${email}` },
    ...["invalid", "client@localhost", "client name@example.test", "client@@example.test", "@example.test", "client@.test"].map((email) => ({ name, email })),
  ]) assert.ok("error" in validateClientInput(invalid));
});
