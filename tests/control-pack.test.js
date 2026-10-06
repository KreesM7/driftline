import test from "node:test";
import assert from "node:assert/strict";
import { CONTROL_META, validateControlPack } from "../src/control-pack.js";

test("data-only packs reject executable fields and duplicate controls", () => {
  const control = { ...CONTROL_META.firewall };
  assert.throws(() => validateControlPack({
    schemaVersion: 1, controls: [{ ...control, command: "anything" }],
  }), /cannot define commands/);
  assert.throws(() => validateControlPack({
    schemaVersion: 1, controls: [control, control],
  }), /Invalid control metadata/);
  assert.equal(Object.isFrozen(CONTROL_META.firewall), true);
});
