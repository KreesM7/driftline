import test from "node:test";
import assert from "node:assert/strict";
import { runCli } from "../src/cli.js";
import { createSnapshot } from "../src/model.js";

const results = [{
  id: "firewall", title: "Firewall", status: "attention", severity: "high",
  evidence: [{ label: "Enabled profiles", value: "2 of 3" }], nextStep: "Review settings.",
}];

test("--no-history emits structured results without any state access", async () => {
  let output = "";
  const forbid = async () => { throw new Error("state touched"); };
  await runCli(["check", "--json", "--no-history"], {
    store: { load: forbid, saveSnapshot: forbid }, platform: "win32",
    collect: async () => results, now: () => "2026-10-06T00:00:00Z",
    write: (text) => { output += text; },
  });
  const parsed = JSON.parse(output);
  assert.equal(parsed.historySaved, false);
  assert.equal(parsed.snapshot.results[0].status, "attention");
});

test("check saves a baseline; acknowledgement does not remove attention", async () => {
  let state = { snapshot: null, acknowledgements: {} };
  const store = {
    load: async () => state,
    saveSnapshot: async (snapshot) => { state.snapshot = snapshot; },
    acknowledge: async (id, timestamp) => { state.acknowledgements[id] = timestamp; },
  };
  const dependencies = { store, collect: async () => results, write: () => {}, platform: "win32" };
  await runCli(["check"], dependencies);
  await runCli(["acknowledge", "firewall"], dependencies);
  assert.equal(state.snapshot.results[0].status, "attention");
  assert.equal(typeof state.acknowledgements.firewall, "string");
  await assert.rejects(() => runCli(["acknowledge", "missing"], dependencies), /not present/);
});

test("CLI rejects unexpected inputs and exports only a saved snapshot", async () => {
  const store = { load: async () => ({ snapshot: createSnapshot({
    platform: "win32", observedAt: "2026-10-06T00:00:00Z", results,
  }) }) };
  await assert.rejects(() => runCli(["check", "--command", "anything"]), /Unknown or repeated/);
  await assert.rejects(() => runCli(["report", "--format", "html"]), /requires/);
  await assert.rejects(() => runCli(["check", "--json", "--json"]), /repeated/);
  let written;
  await runCli(["report", "--format", "html", "--output", "report.html"], {
    store, write: () => {}, writeReport: async (path, content) => { written = { path, content }; },
  });
  assert.equal(written.path, "report.html");
  assert.match(written.content, /Attention: Firewall/);
});
