import test from "node:test";
import assert from "node:assert/strict";

import { collectLinuxProbes, evaluateLinuxFacts, containsCryptMapping } from "../src/probes/linux.js";

test("Linux evaluator handles local package, firewall, encryption, and SSH signals", () => {
  const results = evaluateLinuxFacts({
    update: { manager: "apt", available: true, readable: true },
    encryption: { protected: true, readable: true },
    firewall: { enabled: true, readable: true },
    remoteAccess: { sshActive: false, readable: true },
  });
  const byId = new Map(results.map((item) => [item.id, item]));

  assert.equal(byId.get("updates").status, "attention");
  assert.equal(byId.get("disk-encryption").status, "pass");
  assert.equal(byId.get("firewall").status, "pass");
  assert.equal(byId.get("screen-lock").status, "unknown");
  assert.equal(byId.get("remote-access").status, "pass");
});

test("Linux collector detects 10 upgrades and socket-activated SSH", async () => {
  const queried = [];
  const runner = {
    has: async (command) => ["apt-get", "systemctl"].includes(command),
    run: async (command, args) => {
      if (command === "apt-get") {
        return { ok: true, code: 0, stdout: "10 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n" };
      }
      if (command === "lsblk") return { ok: false, stdout: "" };
      queried.push(args[1]);
      return args[1] === "ssh.socket"
        ? { ok: true, code: 0, stdout: "active\n" }
        : { ok: false, code: 3, stdout: "inactive\n" };
    },
  };
  const results = await collectLinuxProbes(runner);
  assert.equal(results.find((item) => item.id === "updates").status, "attention");
  assert.equal(results.find((item) => item.id === "remote-access").status, "attention");
  assert.equal(queried.includes("ssh.socket"), true);
});

test("containsCryptMapping walks a sanitized lsblk tree", () => {
  assert.equal(containsCryptMapping([{ type: "disk", children: [{ type: "crypt", mountpoints: ["/"] }] }]), true);
  assert.equal(containsCryptMapping([{ type: "crypt", mountpoints: ["/media/backup"] }]), false);
  assert.equal(containsCryptMapping([{ type: "crypt", children: [{ type: "lvm", mountpoints: ["/"] }] }]), true);
  assert.equal(containsCryptMapping([{ type: "disk", children: [{ type: "part" }] }]), false);
});
