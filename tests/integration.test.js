import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createStateStore } from "../src/state.js";
import { createSnapshot } from "../src/model.js";

const run = promisify(execFile);
const bin = fileURLToPath(new URL("../bin/driftline.js", import.meta.url));

test("real CLI reads a fixture baseline and exports a report without overwrite", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "driftline-integration-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createStateStore({ dataDir: join(directory, "state") });
  const first = createSnapshot({
    platform: "fixture", observedAt: "2026-10-06T00:00:00Z",
    results: [{
      id: "firewall", title: "Firewall", status: "pass", severity: "high",
      evidence: [{ label: "Profiles", value: "3 of 3" }], nextStep: "Review OS settings.",
    }],
  });
  await store.saveSnapshot(first);
  await store.saveSnapshot(createSnapshot({
    ...first, results: first.results.map((result) => ({ ...result, status: "attention" })),
  }));
  const { stdout } = await run(process.execPath, [bin, "status", "--json", "--data-dir", store.dataDir]);
  assert.equal(JSON.parse(stdout).changes[0].kind, "status");
  const output = join(directory, "report.html");
  await run(process.execPath, [bin, "report", "--format", "html", "--output", output, "--data-dir", store.dataDir]);
  const report = await readFile(output, "utf8");
  assert.match(report, /Attention: Firewall/);
  assert.doesNotMatch(report, /<script/);
  await assert.rejects(() => run(process.execPath,
    [bin, "report", "--format", "html", "--output", output, "--data-dir", store.dataDir]),
    (error) => error.code === 2 && /already exists/.test(error.stderr));
  assert.equal(await readFile(output, "utf8"), report);
});

test("malformed and oversized state fail with an actionable error", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "driftline-invalid-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = createStateStore({ dataDir: directory });
  await writeFile(store.path, "{bad json");
  await assert.rejects(() => store.load(), /could not be read safely/);
  await writeFile(store.path, "x".repeat(256 * 1024 + 1));
  await assert.rejects(() => store.load(), /could not be read safely/);
});
