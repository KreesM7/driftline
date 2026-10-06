import { result } from "./shared.js";

function stdout(response) {
  return String(response?.stdout || "").trim();
}

function resultForUnavailable(id, limitation) {
  return result(id, "unknown", { limitation });
}

export function containsCryptMapping(devices, encryptedAncestor = false, depth = 0) {
  if (!Array.isArray(devices) || depth > 32) {
    return false;
  }
  for (const device of devices || []) {
    const encrypted = encryptedAncestor || device?.type === "crypt";
    const mounts = Array.isArray(device?.mountpoints) ? device.mountpoints : [device?.mountpoint];
    if (encrypted && mounts.includes("/")) {
      return true;
    }
    if (containsCryptMapping(device?.children, encrypted, depth + 1)) {
      return true;
    }
  }
  return false;
}

export function evaluateLinuxFacts(facts) {
  const results = [];
  if (!facts.update?.readable) {
    results.push(resultForUnavailable("updates", "No supported local package-manager simulation was available."));
  } else if (facts.update.available) {
    results.push(result("updates", "attention", {
      evidence: [{ label: "Updates reported by " + facts.update.manager, value: "Available" }],
    }));
  } else {
    results.push(result("updates", "unknown", {
      evidence: [{ label: "Updates reported by " + facts.update.manager, value: "None available from local metadata" }],
      limitation: "Local package metadata can be stale. Driftline does not refresh repositories or establish patch freshness.",
    }));
  }

  if (!facts.encryption?.readable) {
    results.push(resultForUnavailable("disk-encryption", "Driftline could not read block-device metadata."));
  } else if (facts.encryption.protected) {
    results.push(result("disk-encryption", "pass", {
      evidence: [{ label: "Root filesystem", value: "Encrypted mapper detected in ancestor chain" }],
      limitation: "Only root filesystem mapper evidence is checked. Other volumes and encryption strength are not assessed.",
    }));
  } else {
    results.push(resultForUnavailable("disk-encryption", "No encrypted block-device mapper was detected. This does not prove the device is unencrypted."));
  }

  if (!facts.firewall?.readable) {
    results.push(resultForUnavailable("firewall", "No supported local firewall status command was available."));
  } else if (facts.firewall.enabled) {
    results.push(result("firewall", "pass", {
      evidence: [{ label: "Supported firewall service", value: "Active" }],
      limitation: "Only UFW or firewalld status is checked. Custom firewall rules and other managers are not assessed.",
    }));
  } else {
    results.push(result("firewall", "attention", {
      evidence: [{ label: "Supported firewall service", value: "Inactive" }],
      limitation: "Only UFW or firewalld status is checked. Another firewall may be configured.",
    }));
  }

  results.push(resultForUnavailable("screen-lock", "Linux desktop lock settings vary by desktop environment, so Driftline does not guess."));

  if (!facts.remoteAccess?.readable) {
    results.push(resultForUnavailable("remote-access", "SSH service status was unavailable."));
  } else if (facts.remoteAccess.sshActive) {
    results.push(result("remote-access", "attention", {
      evidence: [{ label: "SSH service", value: "Active" }],
      limitation: "Only common systemd SSH services and sockets are checked. Active does not prove network reachability.",
    }));
  } else {
    results.push(result("remote-access", "pass", {
      evidence: [{ label: "SSH service", value: "Inactive" }],
      limitation: "Only common systemd SSH services and sockets are checked. Other remote tools or manually started servers are not covered.",
    }));
  }
  return results;
}

async function collectUpdateFact(runner) {
  if (await runner.has("apt-get")) {
    const response = await runner.run("apt-get", ["-s", "upgrade"]);
    const text = stdout(response);
    const counts = text.match(/(?:^|\n)(\d+) upgraded, (\d+) newly installed, \d+ to remove and (\d+) not upgraded/m);
    if (response.ok && counts) {
      return { manager: "apt", available: counts.slice(1).some((count) => Number(count) > 0), readable: true };
    }
    return { manager: "apt", available: false, readable: false };
  }
  if (await runner.has("dnf")) {
    const response = await runner.run("dnf", ["--cacheonly", "check-update"]);
    if (response.ok) {
      return { manager: "dnf", available: false, readable: true };
    }
    if (response.code === 100) {
      return { manager: "dnf", available: true, readable: true };
    }
    return { manager: "dnf", available: false, readable: false };
  }
  if (await runner.has("pacman")) {
    const response = await runner.run("pacman", ["-Qu"]);
    return { manager: "pacman", available: stdout(response) !== "", readable: response.ok };
  }
  return { manager: "none", available: false, readable: false };
}

async function collectFirewallFact(runner) {
  if (await runner.has("ufw")) {
    const response = await runner.run("ufw", ["status"]);
    const text = stdout(response);
    if (!response.ok || !/Status:\s+(active|inactive)/i.test(text)) {
      return { enabled: false, readable: false };
    }
    return { enabled: /Status:\s+active/i.test(text), readable: true };
  }
  if (await runner.has("systemctl")) {
    const response = await runner.run("systemctl", ["is-active", "firewalld"]);
    const text = stdout(response);
    if (text === "active" || text === "inactive") {
      return { enabled: text === "active", readable: true };
    }
  }
  return { enabled: false, readable: false };
}

async function collectRemoteAccessFact(runner) {
  if (!(await runner.has("systemctl"))) {
    return { sshActive: false, readable: false };
  }
  let known = true;
  for (const service of ["ssh.service", "sshd.service", "ssh.socket", "sshd.socket"]) {
    const response = await runner.run("systemctl", ["is-active", service]);
    const text = stdout(response);
    if (text === "active") {
      return { sshActive: true, readable: true };
    }
    const missing = response.code === 4 && text === "unknown";
    if (!missing && !(response.code === 3 && text === "inactive")) known = false;
  }
  return { sshActive: false, readable: known };
}

export async function collectLinuxProbes(runner) {
  const [update, blockDevices, firewall, remoteAccess] = await Promise.all([
    collectUpdateFact(runner),
    runner.run("lsblk", ["-J", "-o", "TYPE,MOUNTPOINTS"]),
    collectFirewallFact(runner),
    collectRemoteAccessFact(runner),
  ]);
  let encryption = { protected: false, readable: false };
  if (blockDevices.ok) {
    try {
      const parsed = JSON.parse(blockDevices.stdout);
      encryption = { protected: containsCryptMapping(parsed.blockdevices), readable: Array.isArray(parsed.blockdevices) };
    } catch {
      encryption = { protected: false, readable: false };
    }
  }
  return evaluateLinuxFacts({ update, encryption, firewall, remoteAccess });
}
