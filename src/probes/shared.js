import { createResult } from "../model.js";
import { CONTROL_META } from "../control-pack.js";

export { CONTROL_META };

export function result(id, status, fields = {}) {
  const meta = CONTROL_META[id];
  if (!meta) {
    throw new Error("Unknown Driftline control: " + id);
  }
  return createResult({
    id,
    title: meta.title,
    status,
    severity: fields.severity || meta.severity,
    evidence: fields.evidence || [],
    nextStep: fields.nextStep || meta.nextStep,
    limitation: fields.limitation,
  });
}

export function unknown(id, limitation) {
  return result(id, "unknown", { limitation });
}

export function unknownAll(limitation) {
  return Object.keys(CONTROL_META).map((id) => unknown(id, limitation));
}

export function unsupportedAll(limitation) {
  return Object.keys(CONTROL_META).map((id) => result(id, "unsupported", { limitation }));
}

export function arrayOf(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined || value === null ? [] : [value];
}

export function asBoolean(value) {
  return value === true || value === 1 || ["1", "true", "on"].includes(String(value).trim().toLowerCase());
}

export function asOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
