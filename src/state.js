import { access, chmod, lstat, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { createSnapshot, diffSnapshots } from "./model.js";

const STATE_FILE = "state.json";
const ACKNOWLEDGEMENT_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_TEXT_LENGTH = 180;
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const IPV6 = /\b(?:[a-f0-9]{1,4}:){2,7}[a-f0-9]{1,4}\b/gi;
const WINDOWS_PATH = /[a-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/gi;
const UNC_PATH = /\\\\[^\\\s]+\\[^\\\s]+(?:\\[^\\\s]+)*/g;
const HOME_PATH = /\/(?:Users|home)\/[^/\s]+(?:\/[^\s]*)?/gi;
const TAGGED_IDENTIFIER = /\b(user(?:name)?|account|host(?:name)?|computer(?:name)?)\s*[:=]\s*[^,;|\r\n]+/gi;

function defaultDataDirectory() {
  const home = homedir();
  if (platform() === "win32") {
    return join(process.env.APPDATA || home, "Driftline");
  }
  if (platform() === "darwin") {
    return join(home, "Library", "Application Support", "Driftline");
  }
  return join(process.env.XDG_STATE_HOME || join(home, ".local", "state"), "driftline");
}

function emptyState() {
  return { schemaVersion: 1, snapshot: null, changes: [], acknowledgements: Object.create(null) };
}

function safeText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(WINDOWS_PATH, "[redacted-path]")
    .replace(UNC_PATH, "[redacted-path]")
    .replace(HOME_PATH, "[redacted-path]")
    .replace(IPV4, "[redacted-ip]")
    .replace(IPV6, "[redacted-ip]")
    .replace(TAGGED_IDENTIFIER, (_match, label) => label + ": [redacted]")
    .slice(0, MAX_TEXT_LENGTH);
}

function persistableSnapshot(snapshot) {
  const valid = createSnapshot(snapshot);
  return {
    schemaVersion: valid.schemaVersion,
    platform: safeText(valid.platform),
    observedAt: safeText(valid.observedAt),
    results: valid.results.map((result) => ({
      id: result.id,
      title: safeText(result.title),
      status: result.status,
      severity: result.severity,
      evidence: result.evidence.map((item) => ({
        label: safeText(item.label),
        value: safeText(item.value),
      })),
      nextStep: result.nextStep ? safeText(result.nextStep) : undefined,
      limitation: result.limitation ? safeText(result.limitation) : undefined,
    })),
  };
}

function validatedState(parsed) {
  if (!parsed || typeof parsed !== "object" || parsed.schemaVersion !== 1) {
    throw new Error("Driftline state has an unsupported format. Rename the state file and run check again.");
  }
  const state = emptyState();
  if (parsed.snapshot !== null && parsed.snapshot !== undefined) {
    state.snapshot = persistableSnapshot(parsed.snapshot);
  }
  if (parsed.changes !== undefined) {
    if (!Array.isArray(parsed.changes) || parsed.changes.length > 100) {
      throw new Error("Driftline state changes are invalid.");
    }
    const kinds = ["status", "added", "removed", "evidence"];
    const values = ["pass", "attention", "unknown", "unsupported", "not-observed", "evidence changed"];
    state.changes = parsed.changes.map((change) => {
      if (!change || !ACKNOWLEDGEMENT_ID.test(change.id) || !kinds.includes(change.kind) ||
          !values.includes(change.before) || !values.includes(change.after)) {
        throw new Error("Driftline state changes are invalid.");
      }
      return { id: change.id, kind: change.kind, before: change.before, after: change.after };
    });
  }
  if (parsed.acknowledgements !== undefined) {
    if (!parsed.acknowledgements || typeof parsed.acknowledgements !== "object" || Array.isArray(parsed.acknowledgements)) {
      throw new Error("Driftline state acknowledgements are invalid.");
    }
    for (const [id, value] of Object.entries(parsed.acknowledgements)) {
      if (ACKNOWLEDGEMENT_ID.test(id) && typeof value === "string") {
        state.acknowledgements[id] = value;
      }
    }
  }
  return state;
}

export function createStateStore(options = {}) {
  const dataDir = resolve(options.dataDir || defaultDataDirectory());
  if (!isAbsolute(dataDir)) {
    throw new Error("Driftline state directory must be absolute.");
  }
  const statePath = join(dataDir, STATE_FILE);

  async function ensureDirectory() {
    await mkdir(dataDir, { recursive: true, mode: 0o700 });
    if (platform() !== "win32") {
      await chmod(dataDir, 0o700);
    }
  }

  async function load() {
    await ensureDirectory();
    try {
      await access(statePath, constants.F_OK);
    } catch {
      return emptyState();
    }
    let parsed;
    try {
      const file = await lstat(statePath);
      if (!file.isFile() || file.isSymbolicLink() || file.size > 256 * 1024) {
        throw new Error("Invalid or oversized state file.");
      }
      parsed = JSON.parse(await readFile(statePath, "utf8"));
    } catch {
      throw new Error("Driftline state could not be read safely. Rename the state file and run check again.");
    }
    return validatedState(parsed);
  }

  async function save(nextState) {
    await ensureDirectory();
    const checked = validatedState(nextState);
    const tmpPath = join(dirname(statePath), `.${STATE_FILE}.${randomUUID()}.tmp`);
    await writeFile(tmpPath, `${JSON.stringify(checked, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
    try {
      if (platform() !== "win32") {
        await chmod(tmpPath, 0o600);
      }
      await rename(tmpPath, statePath);
    } catch (error) {
      await unlink(tmpPath).catch(() => {});
      throw error;
    }
  }

  async function saveSnapshot(snapshot) {
    const state = await load();
    const next = persistableSnapshot(snapshot);
    state.changes = diffSnapshots(state.snapshot, next);
    state.snapshot = next;
    await save(state);
    return state.snapshot;
  }

  async function acknowledge(id, acknowledgedAt = new Date().toISOString()) {
    if (!ACKNOWLEDGEMENT_ID.test(id)) {
      throw new Error("Check identifier is invalid.");
    }
    const state = await load();
    state.acknowledgements[id] = safeText(acknowledgedAt);
    await save(state);
    return state.acknowledgements[id];
  }

  return Object.freeze({
    dataDir,
    path: statePath,
    load,
    saveSnapshot,
    acknowledge,
  });
}
