export const STATUSES = Object.freeze(["pass", "attention", "unknown", "unsupported"]);
export const SEVERITIES = Object.freeze(["critical", "high", "medium", "low", "info"]);

function requireNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function optionalString(value, label) {
  if (value === undefined || value === null) {
    return undefined;
  }
  return requireNonEmptyString(value, label);
}

function validateEvidence(evidence) {
  if (evidence === undefined) {
    return Object.freeze([]);
  }
  if (!Array.isArray(evidence)) {
    throw new TypeError("evidence must be an array");
  }
  return Object.freeze(evidence.map((item) => {
    if (!item || typeof item !== "object") {
      throw new TypeError("each evidence item must be an object");
    }
    return Object.freeze({
      label: requireNonEmptyString(item.label, "evidence label"),
      value: requireNonEmptyString(item.value, "evidence value"),
    });
  }));
}

function evidenceSignature(result) {
  return JSON.stringify(
    result.evidence
      .map((item) => [item.label, item.value])
      .sort(([leftLabel, leftValue], [rightLabel, rightValue]) => (
        leftLabel.localeCompare(rightLabel) || leftValue.localeCompare(rightValue)
      )),
  );
}

export function createResult(input) {
  if (!input || typeof input !== "object") {
    throw new TypeError("result must be an object");
  }
  if (!STATUSES.includes(input.status)) {
    throw new TypeError(`unsupported result status: ${input.status}`);
  }
  if (!SEVERITIES.includes(input.severity)) {
    throw new TypeError(`unsupported severity: ${input.severity}`);
  }

  return Object.freeze({
    id: requireNonEmptyString(input.id, "result id"),
    title: requireNonEmptyString(input.title, "result title"),
    status: input.status,
    severity: input.severity,
    evidence: validateEvidence(input.evidence),
    nextStep: optionalString(input.nextStep, "next step"),
    limitation: optionalString(input.limitation, "limitation"),
  });
}

export function createSnapshot(input) {
  if (!input || typeof input !== "object" || !Array.isArray(input.results)) {
    throw new TypeError("snapshot results must be an array");
  }
  const ids = new Set();
  const results = input.results.map((result) => {
    const normalized = createResult(result);
    if (ids.has(normalized.id)) {
      throw new TypeError(`duplicate result id: ${normalized.id}`);
    }
    ids.add(normalized.id);
    return normalized;
  });

  return Object.freeze({
    schemaVersion: 1,
    platform: requireNonEmptyString(input.platform, "platform"),
    observedAt: requireNonEmptyString(input.observedAt, "observedAt"),
    results: Object.freeze(results),
  });
}

export function diffSnapshots(previous, current) {
  if (previous === null || previous === undefined) {
    return [];
  }
  const previousById = new Map(previous.results.map((result) => [result.id, result]));
  const currentIds = new Set();
  const changes = [];

  for (const currentResult of current.results) {
    currentIds.add(currentResult.id);
    const before = previousById.get(currentResult.id);
    if (!before) {
      changes.push({ id: currentResult.id, kind: "added", before: "not-observed", after: currentResult.status });
      continue;
    }
    if (before.status !== currentResult.status) {
      changes.push({ id: currentResult.id, kind: "status", before: before.status, after: currentResult.status });
      continue;
    }
    if (evidenceSignature(before) !== evidenceSignature(currentResult)) {
      changes.push({
        id: currentResult.id,
        kind: "evidence",
        before: "evidence changed",
        after: "evidence changed",
      });
    }
  }
  for (const previousResult of previous.results) {
    if (!currentIds.has(previousResult.id)) {
      changes.push({
        id: previousResult.id,
        kind: "removed",
        before: previousResult.status,
        after: "not-observed",
      });
    }
  }
  return changes;
}

export function summarizeResults(results) {
  const summary = { pass: 0, attention: 0, unknown: 0, unsupported: 0 };
  for (const result of results) {
    if (Object.hasOwn(summary, result.status)) {
      summary[result.status] += 1;
    }
  }
  return summary;
}
