import test from "node:test";
import assert from "node:assert/strict";
import { evaluateWindowsFacts } from "../src/probes/windows.js";
import { evaluateMacFacts } from "../src/probes/macos.js";
import { evaluateLinuxFacts } from "../src/probes/linux.js";

// Synthetic signal-level rubric, not device-level security ground truth.
const cases = [
  [evaluateWindowsFacts, { updateServiceRunning: true }, "updates", "unknown"],
  [evaluateWindowsFacts, { updateServiceRunning: false }, "updates", "unknown"],
  [evaluateWindowsFacts, { rebootPending: true }, "updates", "attention"],
  [evaluateWindowsFacts, { bitLocker: [{ ProtectionStatus: "On" }] }, "disk-encryption", "pass"],
  [evaluateWindowsFacts, { bitLocker: [{ ProtectionStatus: "Off" }] }, "disk-encryption", "attention"],
  [evaluateWindowsFacts, { bitLocker: [] }, "disk-encryption", "unknown"],
  [evaluateWindowsFacts, { firewallProfiles: [{ Enabled: true }] }, "firewall", "pass"],
  [evaluateWindowsFacts, { firewallProfiles: [{ Enabled: false }] }, "firewall", "attention"],
  [evaluateWindowsFacts, { firewallProfiles: [] }, "firewall", "unknown"],
  [evaluateWindowsFacts, { inactivityTimeoutSecs: 600 }, "screen-lock", "pass"],
  [evaluateWindowsFacts, { screenSaverActive: "0" }, "screen-lock", "attention"],
  [evaluateWindowsFacts, {}, "screen-lock", "unknown"],
  [evaluateWindowsFacts, { rdpEnabled: false }, "remote-access", "pass"],
  [evaluateWindowsFacts, { rdpEnabled: true }, "remote-access", "attention"],
  [evaluateWindowsFacts, {}, "remote-access", "unknown"],
  [evaluateMacFacts, { update: { readable: true, autoCheckEnabled: true } }, "updates", "unknown"],
  [evaluateMacFacts, { update: { readable: true, autoCheckEnabled: false } }, "updates", "attention"],
  [evaluateMacFacts, { encryption: { readable: true, enabled: true } }, "disk-encryption", "pass"],
  [evaluateMacFacts, { encryption: { readable: true, enabled: false } }, "disk-encryption", "attention"],
  [evaluateMacFacts, {}, "disk-encryption", "unknown"],
  [evaluateMacFacts, { firewall: { readable: true, enabled: true } }, "firewall", "pass"],
  [evaluateMacFacts, { firewall: { readable: true, enabled: false } }, "firewall", "attention"],
  [evaluateMacFacts, { screenLock: { readable: true, timeoutSecs: 300, requiresPassword: true, passwordDelaySecs: 0 } }, "screen-lock", "pass"],
  [evaluateMacFacts, { screenLock: { readable: true, timeoutSecs: 1800, requiresPassword: true, passwordDelaySecs: 0 } }, "screen-lock", "attention"],
  [evaluateMacFacts, { remoteAccess: { readable: true, remoteLogin: false, remoteEvents: false } }, "remote-access", "pass"],
  [evaluateMacFacts, { remoteAccess: { readable: true, remoteLogin: true, remoteEvents: false } }, "remote-access", "attention"],
  [evaluateLinuxFacts, { update: { manager: "apt", readable: true, available: false } }, "updates", "unknown"],
  [evaluateLinuxFacts, { update: { manager: "apt", readable: true, available: true } }, "updates", "attention"],
  [evaluateLinuxFacts, { encryption: { readable: true, protected: true } }, "disk-encryption", "pass"],
  [evaluateLinuxFacts, { encryption: { readable: true, protected: false } }, "disk-encryption", "unknown"],
  [evaluateLinuxFacts, { firewall: { readable: true, enabled: true } }, "firewall", "pass"],
  [evaluateLinuxFacts, { firewall: { readable: true, enabled: false } }, "firewall", "attention"],
  [evaluateLinuxFacts, { remoteAccess: { readable: true, sshActive: false } }, "remote-access", "pass"],
  [evaluateLinuxFacts, { remoteAccess: { readable: true, sshActive: true } }, "remote-access", "attention"],
  [evaluateLinuxFacts, {}, "screen-lock", "unknown"],
];

test("35 synthetic signal cases match a three-state rubric without hiding uncertainty", (t) => {
  const counts = { pass: 0, attention: 0, unknown: 0 };
  let falsePositive = 0;
  let falseNegative = 0;
  let unsafeUnknownPass = 0;
  for (const [evaluate, facts, id, expected] of cases) {
    const actual = evaluate(facts).find((result) => result.id === id).status;
    counts[expected]++;
    if (expected === "pass" && actual === "attention") falsePositive++;
    if (expected === "attention" && actual === "pass") falseNegative++;
    if (expected === "unknown" && actual === "pass") unsafeUnknownPass++;
    assert.equal(actual, expected, evaluate.name + ": " + id);
  }
  t.diagnostic(JSON.stringify({ cases: cases.length, expected: counts, falsePositive, falseNegative, unsafeUnknownPass }));
});
