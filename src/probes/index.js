import { collectLinuxProbes } from "./linux.js";
import { collectMacProbes } from "./macos.js";
import { unsupportedAll } from "./shared.js";
import { collectWindowsProbes } from "./windows.js";

export async function collectPlatformProbes(platform, runner) {
  if (platform === "win32") {
    return collectWindowsProbes(runner);
  }
  if (platform === "darwin") {
    return collectMacProbes(runner);
  }
  if (platform === "linux") {
    return collectLinuxProbes(runner);
  }
  return unsupportedAll("Driftline does not yet support this operating system, so it did not run a probe.");
}
