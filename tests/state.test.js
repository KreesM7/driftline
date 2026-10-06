import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createSnapshot } from "../src/model.js";
import { createStateStore } from "../src/state.js";

test("state store atomically retains a redacted snapshot and acknowledgement", async (t) => {
  const dataDir = await mkdtemp(join(tmpdir(), "driftline-state-"));
  t.after(() => rm(dataDir, { recursive: true, force: true }));

  const store = createStateStore({ dataDir });
  const snapshot = createSnapshot({
    platform: "win32",
    observedAt: "2026-10-06T00:00:00.000Z",
    results: [{
      id: "firewall",
      title: "Firewall",
      status: "pass",
      severity: "high",
      evidence: [{ label: "Profiles", value: "All profiles enabled" }],
    }],
  });

  await store.saveSnapshot(snapshot);
  await store.acknowledge("firewall", "2026-10-06T01:00:00.000Z");

  const loaded = await store.load();
  const raw = await readFile(store.path, "utf8");

  assert.equal(loaded.snapshot.results[0].status, "pass");
  assert.equal(loaded.acknowledgements.firewall, "2026-10-06T01:00:00.000Z");
  assert.equal(raw.includes("raw-command-output"), false);
});

test("state storage redacts common identity and network identifiers from persisted evidence", async (t) => {
  const dataDir = await mkdtemp(join(tmpdir(), "driftline-redaction-"));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  const store = createStateStore({ dataDir });
  const snapshot = createSnapshot({
    platform: "win32",
    observedAt: "2026-10-06T00:00:00.000Z",
    results: [{
      id: "firewall",
      title: "Firewall",
      status: "attention",
      severity: "high",
      evidence: [{
        label: "Details",
        value: "User: Ada; Hostname: lab-laptop; IP: 192.168.50.10; path C:\\Users\\Ada\\notes.txt",
      }],
    }],
  });

  await store.saveSnapshot(snapshot);
  const raw = await readFile(store.path, "utf8");

  assert.equal(raw.includes("Ada"), false);
  assert.equal(raw.includes("lab-laptop"), false);
  assert.equal(raw.includes("192.168.50.10"), false);
  assert.equal(raw.includes("notes.txt"), false);
  assert.match(raw, /redacted/);
});
