import assert from "node:assert/strict";
import { test } from "node:test";
import { readNewProjectForm } from "../app/lib/project-input";

test("project submission reads the selected client ID and current form values", () => {
  const form = new FormData();
  form.set("name", "  Vídeo real  ");
  form.set("clientId", "7");
  form.set("description", "  Primeira revisão  ");
  assert.deepEqual(readNewProjectForm(form), { name: "Vídeo real", clientId: 7, description: "Primeira revisão" });
  form.set("clientId", "12");
  assert.equal(readNewProjectForm(form).clientId, 12);
});

test("empty form never invents a project name or a valid client ID", () => {
  assert.deepEqual(readNewProjectForm(new FormData()), { name: "", clientId: 0, description: "" });
});
