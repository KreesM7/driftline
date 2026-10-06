import { readFileSync } from "node:fs";
import { SEVERITIES } from "./model.js";

const FIELDS = new Set(["id", "title", "titleAr", "severity", "nextStep"]);

export function validateControlPack(pack) {
  if (!pack || pack.schemaVersion !== 1 || !Array.isArray(pack.controls) ||
      pack.controls.length === 0 || pack.controls.length > 50 ||
      Object.keys(pack).some((key) => !["schemaVersion", "controls"].includes(key))) {
    throw new TypeError("Invalid data-only control pack.");
  }
  const controls = Object.create(null);
  for (const control of pack.controls) {
    if (!control || Object.keys(control).some((key) => !FIELDS.has(key)) ||
        !/^[a-z][a-z0-9-]{0,63}$/.test(control.id) ||
        Object.hasOwn(controls, control.id) || !SEVERITIES.includes(control.severity) ||
        ["title", "titleAr", "nextStep"].some((key) => (
          typeof control[key] !== "string" || control[key].trim() === "" || control[key].length > 500
        ))) {
      throw new TypeError("Invalid control metadata. Packs cannot define commands or code.");
    }
    controls[control.id] = Object.freeze({ ...control });
  }
  return Object.freeze(controls);
}

export const CONTROL_META = validateControlPack(
  JSON.parse(readFileSync(new URL("../data/packs/core.json", import.meta.url), "utf8")),
);
