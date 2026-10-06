import test from "node:test";
import assert from "node:assert/strict";

import { collectMacProbes, evaluateMacFacts } from "../src/probes/macos.js";

test("macOS evaluator treats enabled protections as pass and remote login as attention", () => {
  const results = evaluateMacFacts({
    update: { available: false, readable: true },
    encryption: { enabled: true, readable: true },
    firewall: { enabled: true, readable: true },
    screenLock: { timeoutSecs: 600, requiresPassword: true, passwordDelaySecs: 0, readable: true },
    remoteAccess: { remoteLogin: true, remoteEvents: false, readable: true },
  });
  const byId = new Map(results.map((item) => [item.id, item]));

  assert.equal(byId.get("updates").status, "unknown");
  assert.equal(byId.get("disk-encryption").status, "pass");
  assert.equal(byId.get("firewall").status, "pass");
  assert.equal(byId.get("screen-lock").status, "pass");
  assert.equal(byId.get("remote-access").status, "attention");
});

test("macOS handles trailing newlines and never passes transitioning FileVault", async () => {
  const runner = { async run(command, args) {
    if (command === "defaults") {
      return { ok: true, stdout: args.at(-1) === "idleTime" ? "300\n" : args.at(-1) === "askForPassword" ? "1\n" : "0\n" };
    }
    if (command === "fdesetup") return { ok: true, stdout: "FileVault is On.\nDecryption in progress: Percent completed = 99" };
    return { ok: false, stdout: "" };
  } };
  const results = await collectMacProbes(runner);
  assert.equal(results.find((item) => item.id === "screen-lock").status, "pass");
  assert.equal(results.find((item) => item.id === "disk-encryption").status, "unknown");
});

test("unrecognized macOS command output never becomes a pass", async () => {
  const runner = { async run() { return { ok: true, stdout: "unexpected output" }; } };
  const results = await collectMacProbes(runner);
  assert.equal(results.every((item) => item.status === "unknown"), true);
});

test("macOS probe does not mistake a disabled firewall for an enabled firewall", async () => {
  const runner = {
    async run(command) {
      const outputs = {
        softwareupdate: "No new software available.",
        fdesetup: "FileVault is On.",
        defaults: "1",
        systemsetup: "Remote Login: Off",
        "/usr/libexec/ApplicationFirewall/socketfilterfw": "Firewall is disabled. (State = 0)",
      };
      return { ok: true, stdout: outputs[command] || "0" };
    },
  };

  const results = await collectMacProbes(runner);
  const firewall = results.find((item) => item.id === "firewall");

  assert.equal(firewall.status, "attention");
});
