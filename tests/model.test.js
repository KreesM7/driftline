import test from "node:test";
import assert from "node:assert/strict";

import { createResult, createSnapshot, diffSnapshots } from "../src/model.js";

test("diffSnapshots reports a status transition without treating a first run as drift", () => {
  const first = createSnapshot({
    platform: "win32",
    observedAt: "2026-10-06T00:00:00.000Z",
    results: [{ id: "firewall", title: "Firewall", status: "pass", severity: "high" }],
  });
  const second = createSnapshot({
    platform: "win32",
    observedAt: "2026-10-07T00:00:00.000Z",
    results: [{ id: "firewall", title: "Firewall", status: "attention", severity: "high" }],
  });

  assert.deepEqual(diffSnapshots(null, first), []);
  assert.deepEqual(diffSnapshots(first, second), [{
    id: "firewall",
    kind: "status",
    before: "pass",
    after: "attention",
  }]);
});

test("diffSnapshots records evidence changes and controls that disappear", () => {
  const first = createSnapshot({
    platform: "win32",
    observedAt: "2026-10-06T00:00:00.000Z",
    results: [
      {
        id: "firewall",
        title: "Firewall",
        status: "pass",
        severity: "high",
        evidence: [{ label: "Profiles", value: "3 of 3" }],
      },
      { id: "updates", title: "Updates", status: "pass", severity: "high" },
    ],
  });
  const second = createSnapshot({
    platform: "win32",
    observedAt: "2026-10-07T00:00:00.000Z",
    results: [{
      id: "firewall",
      title: "Firewall",
      status: "pass",
      severity: "high",
      evidence: [{ label: "Profiles", value: "2 of 2" }],
    }],
  });

  assert.deepEqual(diffSnapshots(first, second), [
    { id: "firewall", kind: "evidence", before: "evidence changed", after: "evidence changed" },
    { id: "updates", kind: "removed", before: "pass", after: "not-observed" },
  ]);
});

test("a normalized result does not expose a mutable evidence array", () => {
  const result = createResult({
    id: "firewall",
    title: "Firewall",
    status: "pass",
    severity: "high",
    evidence: [{ label: "Profiles", value: "3 of 3" }],
  });

  assert.equal(Object.isFrozen(result.evidence), true);
  assert.throws(() => result.evidence.push({ label: "new", value: "value" }), TypeError);
});
