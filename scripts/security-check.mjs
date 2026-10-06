import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const forbiddenAppPatterns = [
  ["dynamic evaluation", /\beval\s*\(|new\s+Function\s*\(/],
  ["shell execution", /\bshell\s*:\s*true|\bexec\s*\(|\bexecSync\s*\(/],
  ["network APIs", /(?:from|import)\s*["']node:(?:http|https|net|tls|dns)["']|\bfetch\s*\(/],
  ["configuration writes", /Set-ItemProperty|Set-NetFirewallProfile|Enable-BitLocker|Disable-BitLocker/],
];
const secretPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b/],
  ["AWS key", /\bAKIA[A-Z0-9]{16}\b/],
];
async function scan(directory, isApp = false) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", "artifacts"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await scan(path, isApp || entry.name === "src"); continue; }
    if (!/\.(js|mjs|json|md|yml|yaml|ps1|sh)$/.test(path)) continue;
    const source = await readFile(path, "utf8");
    for (const [name, pattern] of [...secretPatterns, ...(isApp ? forbiddenAppPatterns : [])]) {
      if (pattern.test(source)) throw new Error("Static guard failed (" + name + "): " + entry.name);
    }
  }
}
await scan(root);
console.log("Limited static security and secret-pattern guards passed. This is not a complete SAST or secrets audit.");
