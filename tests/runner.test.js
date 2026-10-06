import test from "node:test";
import assert from "node:assert/strict";

import { createRunner } from "../src/runner.js";

test("runner rejects commands outside its fixed allowlist", async () => {
  const runner = createRunner({ commandExists: async () => true });

  await assert.rejects(
    () => runner.run("cmd.exe", ["/c", "whoami"]),
    /not allowed/,
  );
  await assert.rejects(() => runner.run("C:/tmp/powershell.exe", []), /not allowed/);
});

test("runner invokes an allowlisted command without a shell and bounds its result", async () => {
  let received;
  const fakeExecFile = (file, args, options, callback) => {
    received = { file, args, options };
    callback(null, "ok", "");
    return { kill() {} };
  };
  const runner = createRunner({ execFileImpl: fakeExecFile, commandExists: async () => true });

  const result = await runner.run("powershell.exe", ["-NoProfile", "-Command", "Write-Output ok"]);

  assert.equal(result.ok, true);
  assert.equal(result.stdout, "ok");
  assert.equal(received.options.shell, false);
  assert.equal(received.options.windowsHide, true);
});
