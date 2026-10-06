import test from "node:test";
import assert from "node:assert/strict";

import { collectPlatformProbes } from "../src/probes/index.js";

test("unsupported platforms report unsupported controls instead of guessing", async () => {
  const results = await collectPlatformProbes("freebsd", { run: async () => { throw new Error("not reached"); } });

  assert.equal(results.length, 5);
  assert.equal(results.every((result) => result.status === "unsupported"), true);
});
