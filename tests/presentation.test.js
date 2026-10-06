import test from "node:test";
import assert from "node:assert/strict";

import { createSnapshot } from "../src/model.js";
import { formatTerminal, renderHtmlReport, renderMarkdownReport } from "../src/presentation.js";

const snapshot = createSnapshot({
  platform: "win32",
  observedAt: "2026-10-06T00:00:00.000Z",
  results: [{
    id: "firewall",
    title: "Firewall <check>",
    status: "attention",
    severity: "high",
    evidence: [{ label: "Profile", value: "Off <unsafe>" }],
    nextStep: "Enable it before using public Wi-Fi.",
  }],
});

test("HTML report escapes dynamic text and includes a restrictive local CSP", () => {
  const report = renderHtmlReport({ snapshot, changes: [] });

  assert.equal(report.includes("Firewall &lt;check&gt;"), true);
  assert.equal(report.includes("Off &lt;unsafe&gt;"), true);
  assert.equal(report.includes("<unsafe>"), false);
  assert.equal(report.includes("default-src 'none'"), true);
  assert.equal(report.includes("<script"), false);
});

test("terminal and Markdown reports preserve status labels without relying on color", () => {
  assert.match(formatTerminal({ snapshot, changes: [] }), /ATTENTION/);
  assert.match(renderMarkdownReport({ snapshot, changes: [] }), /Attention/);
});

test("Arabic report uses RTL layout and exposes removed controls", () => {
  const report = renderHtmlReport({
    snapshot, language: "ar",
    changes: [{ id: "updates", kind: "removed", before: "unknown", after: "not-observed" }],
  });
  assert.match(report, /lang="ar" dir="rtl"/);
  assert.match(report, /جدار الحماية/);
  assert.match(report, /not-observed/);
});
