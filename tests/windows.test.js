import test from "node:test";
import assert from "node:assert/strict";

import { collectWindowsProbes, evaluateWindowsFacts, WINDOWS_CORE_PROBE_SCRIPT } from "../src/probes/windows.js";

test("Windows evaluator produces plain-language results from sanitized probe facts", () => {
  const results = evaluateWindowsFacts({
    updateServiceRunning: true,
    rebootPending: false,
    bitLocker: [{ ProtectionStatus: "On" }],
    firewallProfiles: [{ Name: "Domain", Enabled: true }, { Name: "Public", Enabled: true }],
    inactivityTimeoutSecs: 600,
    rdpEnabled: true,
    terminalServiceRunning: true,
  });
  const byId = new Map(results.map((result) => [result.id, result]));

  assert.equal(byId.get("updates").status, "unknown");
  assert.equal(byId.get("disk-encryption").status, "pass");
  assert.equal(byId.get("firewall").status, "pass");
  assert.equal(byId.get("screen-lock").status, "pass");
  assert.equal(byId.get("remote-access").status, "attention");
  assert.equal(byId.get("remote-access").nextStep.includes("Review"), true);
});

test("Windows collector sends a multiline fixed PowerShell script to the bounded runner", async () => {
  let receivedCommand;
  let receivedArguments;
  const runner = {
    async run(command, argumentsList) {
      receivedCommand = command;
      receivedArguments = argumentsList;
      return {
        ok: true,
        stdout: JSON.stringify({
          updateServiceRunning: true,
          rebootPending: false,
          bitLocker: [],
          firewallProfiles: [],
        }),
      };
    },
  };

  await collectWindowsProbes(runner);

  assert.equal(receivedCommand, "powershell.exe");
  const script = receivedArguments.at(-1);
  assert.match(script, /\ntry \{/);
  assert.doesNotMatch(script, /\\ntry \{/);
  assert.match(WINDOWS_CORE_PROBE_SCRIPT, /Get-NetFirewallProfile -PolicyStore ActiveStore/);
});

test("a slow or inaccessible BitLocker probe does not discard other Windows results", async () => {
  const runner = {
    async run(_command, argumentsList) {
      const script = argumentsList.at(-1);
      if (script.includes("Get-BitLockerVolume")) {
        return { ok: false, stdout: "", stderr: "access denied", timedOut: true };
      }
      return {
        ok: true,
        stdout: JSON.stringify({
          updateServiceRunning: true,
          rebootPending: false,
          firewallProfiles: [{ Name: "Public", Enabled: true }],
          inactivityTimeoutSecs: 300,
          rdpEnabled: false,
          terminalServiceRunning: false,
        }),
      };
    },
  };

  const results = await collectWindowsProbes(runner);
  const byId = new Map(results.map((item) => [item.id, item]));

  assert.equal(byId.get("updates").status, "unknown");
  assert.equal(byId.get("firewall").status, "pass");
  assert.equal(byId.get("disk-encryption").status, "unknown");
});

test("Windows reports the timeout that actually satisfies the lock policy", () => {
  const results = evaluateWindowsFacts({
    inactivityTimeoutSecs: 1800,
    screenSaverActive: "1",
    screenSaverSecure: "1",
    screenSaverTimeoutSecs: "300",
    rdpEnabled: false,
    terminalServiceRunning: true,
  });
  const lock = results.find((item) => item.id === "screen-lock");
  assert.equal(lock.status, "pass");
  assert.equal(lock.evidence[0].value, "300 seconds");
  assert.equal(results.find((item) => item.id === "remote-access").status, "pass");
});
