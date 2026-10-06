import { asBoolean, asOptionalNumber, result } from "./shared.js";

function isEnabledText(value) {
  return /(?:is |: )on\b|\benabled\b|state = 1/i.test(String(value || ""));
}

function isDisabledText(value) {
  return /(?:is |: )off\b|disabled|state = 0/i.test(String(value || ""));
}

function outputOf(response) {
  return response?.ok ? response.stdout : undefined;
}

export function evaluateMacFacts(facts) {
  const results = [];
  if (!facts.update?.readable) {
    results.push(result("updates", "unknown", { limitation: "macOS update status was unavailable." }));
  } else if (facts.update.autoCheckEnabled === false) {
    results.push(result("updates", "attention", {
      evidence: [{ label: "Automatic update check", value: "Off" }],
    }));
  } else {
    results.push(result("updates", "unknown", {
      evidence: [{ label: "Automatic update check", value: "On" }],
      limitation: "An enabled check does not establish patch freshness. Driftline does not contact Apple's update servers.",
    }));
  }

  if (!facts.encryption?.readable) {
    results.push(result("disk-encryption", "unknown", { limitation: "FileVault status was unavailable." }));
  } else if (facts.encryption.enabled) {
    results.push(result("disk-encryption", "pass", {
      evidence: [{ label: "FileVault", value: "On" }],
    }));
  } else {
    results.push(result("disk-encryption", "attention", {
      evidence: [{ label: "FileVault", value: "Off" }],
    }));
  }

  if (!facts.firewall?.readable) {
    results.push(result("firewall", "unknown", { limitation: "macOS application firewall status was unavailable." }));
  } else if (facts.firewall.enabled) {
    results.push(result("firewall", "pass", {
      evidence: [{ label: "Application firewall", value: "Enabled" }],
      limitation: "Only application firewall state is checked, not packet-filter rules or reachable ports.",
    }));
  } else {
    results.push(result("firewall", "attention", {
      evidence: [{ label: "Application firewall", value: "Disabled" }],
      limitation: "Only application firewall state is checked. Other packet-filter rules may be configured.",
    }));
  }

  const timeout = asOptionalNumber(facts.screenLock?.timeoutSecs);
  const delay = asOptionalNumber(facts.screenLock?.passwordDelaySecs);
  if (!facts.screenLock?.readable) {
    results.push(result("screen-lock", "unknown", {
      limitation: "Driftline could not read the current macOS screen-lock preferences.",
    }));
  } else if (timeout !== undefined && timeout > 0 && timeout <= 900 &&
      asBoolean(facts.screenLock.requiresPassword) && delay !== undefined && delay <= 5) {
    results.push(result("screen-lock", "pass", {
      evidence: [{ label: "Verified lock timeout", value: String(timeout) + " seconds" }],
    }));
  } else {
    results.push(result("screen-lock", "attention", {
      evidence: [{ label: "Screen lock", value: "Review password and timeout settings" }],
    }));
  }

  if (!facts.remoteAccess?.readable) {
    results.push(result("remote-access", "unknown", { limitation: "macOS remote-access settings were unavailable." }));
  } else if (facts.remoteAccess.remoteLogin || facts.remoteAccess.remoteEvents) {
    results.push(result("remote-access", "attention", {
      evidence: [{ label: "Remote services", value: "At least one service is on" }],
      limitation: "Only Remote Login and Remote Apple Events are checked. Screen Sharing and third-party tools are not covered.",
    }));
  } else {
    results.push(result("remote-access", "pass", {
      evidence: [{ label: "Remote services", value: "Remote Login and Remote Apple Events are off" }],
      limitation: "Only Remote Login and Remote Apple Events are checked. Screen Sharing and third-party tools are not covered.",
    }));
  }
  return results;
}

export async function collectMacProbes(runner) {
  const [updates, encryption, firewall, idleTime, askForPassword, passwordDelay, remoteLogin, remoteEvents] = await Promise.all([
    runner.run("softwareupdate", ["--schedule"]),
    runner.run("fdesetup", ["status"]),
    runner.run("/usr/libexec/ApplicationFirewall/socketfilterfw", ["--getglobalstate"]),
    runner.run("defaults", ["-currentHost", "read", "com.apple.screensaver", "idleTime"]),
    runner.run("defaults", ["read", "com.apple.screensaver", "askForPassword"]),
    runner.run("defaults", ["read", "com.apple.screensaver", "askForPasswordDelay"]),
    runner.run("systemsetup", ["-getremotelogin"]),
    runner.run("systemsetup", ["-getremoteappleevents"]),
  ]);
  const updateOutput = outputOf(updates);
  const fileVaultOutput = outputOf(encryption);
  const firewallOutput = outputOf(firewall);
  const remoteLoginOutput = outputOf(remoteLogin);
  const remoteEventsOutput = outputOf(remoteEvents);
  return evaluateMacFacts({
    update: {
      readable: /Automatically check for updates is turned (on|off)/i.test(String(updateOutput || "")),
      autoCheckEnabled: /turned on/i.test(String(updateOutput || "")),
    },
    encryption: {
      readable: /^FileVault is (On|Off)\.\s*$/i.test(String(fileVaultOutput || "").trim()),
      enabled: /^FileVault is On\.\s*$/i.test(String(fileVaultOutput || "").trim()),
    },
    firewall: {
      readable: isEnabledText(firewallOutput) || isDisabledText(firewallOutput),
      enabled: isEnabledText(firewallOutput),
    },
    screenLock: {
      readable: asOptionalNumber(outputOf(idleTime)) !== undefined &&
        asOptionalNumber(outputOf(askForPassword)) !== undefined &&
        asOptionalNumber(outputOf(passwordDelay)) !== undefined,
      timeoutSecs: outputOf(idleTime),
      requiresPassword: outputOf(askForPassword),
      passwordDelaySecs: outputOf(passwordDelay),
    },
    remoteAccess: {
      readable: /Remote Login: (On|Off)/i.test(String(remoteLoginOutput || "")) &&
        /Remote Apple Events: (On|Off)/i.test(String(remoteEventsOutput || "")),
      remoteLogin: isEnabledText(remoteLoginOutput) && !isDisabledText(remoteLoginOutput),
      remoteEvents: isEnabledText(remoteEventsOutput) && !isDisabledText(remoteEventsOutput),
    },
  });
}
