import { arrayOf, asBoolean, asOptionalNumber, result } from "./shared.js";

const WINDOWS_CORE_PROBE_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "try { $firewallProfiles = @(Get-NetFirewallProfile -PolicyStore ActiveStore | Select-Object Name, Enabled) } catch { $firewallProfiles = @() }",
  "try { $updateServiceRunning = ((Get-Service -Name wuauserv).Status -eq 'Running') } catch { $updateServiceRunning = $null }",
  "try { $rebootPending = (Test-Path 'HKLM:\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Component Based Servicing\\\\RebootPending') -or (Test-Path 'HKLM:\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\WindowsUpdate\\\\Auto Update\\\\RebootRequired') } catch { $rebootPending = $null }",
  "try { $screen = Get-ItemProperty -Path 'HKCU:\\\\Control Panel\\\\Desktop' } catch { $screen = $null }",
  "try { $systemPolicy = Get-ItemProperty -Path 'HKLM:\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Policies\\\\System' } catch { $systemPolicy = $null }",
  "try { $rdpEnabled = ((Get-ItemProperty -Path 'HKLM:\\\\SYSTEM\\\\CurrentControlSet\\\\Control\\\\Terminal Server').fDenyTSConnections -eq 0) } catch { $rdpEnabled = $null }",
  "try { $terminalServiceRunning = ((Get-Service -Name TermService).Status -eq 'Running') } catch { $terminalServiceRunning = $null }",
  "[PSCustomObject]@{ firewallProfiles = $firewallProfiles; updateServiceRunning = $updateServiceRunning; rebootPending = $rebootPending; screenSaverActive = $screen.ScreenSaveActive; screenSaverSecure = $screen.ScreenSaverIsSecure; screenSaverTimeoutSecs = $screen.ScreenSaveTimeOut; inactivityTimeoutSecs = $systemPolicy.InactivityTimeoutSecs; rdpEnabled = $rdpEnabled; terminalServiceRunning = $terminalServiceRunning } | ConvertTo-Json -Depth 4 -Compress",
].join("\n");

const WINDOWS_BITLOCKER_PROBE_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "try { $bitLocker = @(Get-BitLockerVolume | Select-Object ProtectionStatus) } catch { $bitLocker = @() }",
  "[PSCustomObject]@{ bitLocker = $bitLocker } | ConvertTo-Json -Depth 4 -Compress",
].join("\n");

function parseFacts(response) {
  if (!response.ok) {
    return {};
  }
  try {
    const parsed = JSON.parse(response.stdout);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function protectedBitLockerVolume(volume) {
  const status = String(volume?.ProtectionStatus ?? "").toLowerCase();
  return status === "on" || status === "1";
}

export function evaluateWindowsFacts(facts) {
  const results = [];
  if (facts.rebootPending === true) {
    results.push(result("updates", "attention", {
      evidence: [{ label: "Restart pending", value: "Yes" }],
      nextStep: "Restart when it is safe to do so, then check Windows Update again.",
    }));
  } else if (facts.updateServiceRunning === true) {
    results.push(result("updates", "unknown", {
      evidence: [{ label: "Windows Update service", value: "Running" }],
      limitation: "A running service does not establish patch freshness. Check Windows Update for pending security updates.",
    }));
  } else if (facts.updateServiceRunning === false) {
    results.push(result("updates", "unknown", {
      evidence: [{ label: "Windows Update service", value: "Not running" }],
      limitation: "Windows Update can start on demand. Service state alone does not establish patch freshness.",
    }));
  } else {
    results.push(result("updates", "unknown", {
      limitation: "Driftline could not read Windows Update status safely.",
    }));
  }

  const volumes = arrayOf(facts.bitLocker);
  if (volumes.length === 0) {
    results.push(result("disk-encryption", "unknown", {
      limitation: "BitLocker status was unavailable. Some editions and removable volumes do not expose this information.",
    }));
  } else if (volumes.every(protectedBitLockerVolume)) {
    results.push(result("disk-encryption", "pass", {
      evidence: [{ label: "Reported protected volumes", value: String(volumes.length) }],
    }));
  } else {
    results.push(result("disk-encryption", "attention", {
      evidence: [{ label: "Reported protected volumes", value: String(volumes.filter(protectedBitLockerVolume).length) + " of " + String(volumes.length) }],
    }));
  }

  const profiles = arrayOf(facts.firewallProfiles);
  if (profiles.length === 0) {
    results.push(result("firewall", "unknown", {
      limitation: "Windows firewall profile status was unavailable.",
    }));
  } else if (profiles.every((profile) => asBoolean(profile?.Enabled))) {
    results.push(result("firewall", "pass", {
      evidence: [{ label: "Enabled profiles", value: String(profiles.length) + " of " + String(profiles.length) }],
      limitation: "Active Windows firewall profile settings are checked, not individual rules or reachable ports.",
    }));
  } else {
    results.push(result("firewall", "attention", {
      evidence: [{ label: "Enabled profiles", value: String(profiles.filter((profile) => asBoolean(profile?.Enabled)).length) + " of " + String(profiles.length) }],
      limitation: "Active Windows firewall profile settings are checked, not individual rules or reachable ports.",
    }));
  }

  const policyTimeout = asOptionalNumber(facts.inactivityTimeoutSecs);
  const saverTimeout = asOptionalNumber(facts.screenSaverTimeoutSecs);
  const saverProtected = asBoolean(facts.screenSaverActive) && asBoolean(facts.screenSaverSecure);
  const qualifyingPolicy = policyTimeout !== undefined && policyTimeout > 0 && policyTimeout <= 900;
  const qualifyingSaver = saverProtected && saverTimeout !== undefined && saverTimeout > 0 && saverTimeout <= 900;
  if (qualifyingPolicy || qualifyingSaver) {
    results.push(result("screen-lock", "pass", {
      evidence: [{ label: "Verified lock timeout", value: String(qualifyingPolicy ? policyTimeout : saverTimeout) + " seconds" }],
    }));
  } else if ((policyTimeout !== undefined && policyTimeout > 900) ||
      (saverTimeout !== undefined && saverTimeout > 900) ||
      (facts.screenSaverActive != null && !asBoolean(facts.screenSaverActive)) ||
      (asBoolean(facts.screenSaverActive) && facts.screenSaverSecure != null && !asBoolean(facts.screenSaverSecure))) {
    const timeout = policyTimeout || saverTimeout;
    results.push(result("screen-lock", "attention", {
      evidence: [{ label: "Verified lock timeout", value: timeout ? String(timeout) + " seconds" : "Not configured" }],
    }));
  } else {
    results.push(result("screen-lock", "unknown", {
      limitation: "Driftline could not verify a password-protected screen-lock policy on this Windows profile.",
    }));
  }

  if (facts.rdpEnabled === true) {
    results.push(result("remote-access", "attention", {
      evidence: [{ label: "Remote Desktop policy", value: "Enabled" }],
      limitation: "Enabled policy does not prove the device is reachable. Third-party remote tools are not checked.",
    }));
  } else if (facts.rdpEnabled === false) {
    results.push(result("remote-access", "pass", {
      evidence: [{ label: "Remote Desktop policy", value: "Disabled" }],
      limitation: "Only Windows Remote Desktop policy is checked. Third-party remote tools are not covered.",
    }));
  } else {
    results.push(result("remote-access", "unknown", {
      limitation: "Driftline could not verify Remote Desktop settings.",
    }));
  }

  return results;
}

export async function collectWindowsProbes(runner) {
  const coreResponse = await runner.run("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    WINDOWS_CORE_PROBE_SCRIPT,
  ]);
  const bitLockerResponse = await runner.run("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    WINDOWS_BITLOCKER_PROBE_SCRIPT,
  ]);
  const coreFacts = parseFacts(coreResponse);
  const bitLockerFacts = parseFacts(bitLockerResponse);
  return evaluateWindowsFacts({ ...coreFacts, bitLocker: bitLockerFacts.bitLocker });
}

export { WINDOWS_BITLOCKER_PROBE_SCRIPT, WINDOWS_CORE_PROBE_SCRIPT };
