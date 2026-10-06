import { createSnapshot } from "../src/model.js";
import { CONTROL_META } from "../src/control-pack.js";
import { renderHtmlReport, writeReport } from "../src/presentation.js";

const statuses = {
  updates: "unknown", "disk-encryption": "pass", firewall: "attention",
  "screen-lock": "pass", "remote-access": "unknown",
};
const snapshot = createSnapshot({
  platform: "SYNTHETIC EXAMPLE — not a real device",
  observedAt: "2026-10-06T00:00:00Z",
  results: Object.entries(CONTROL_META).map(([id, meta]) => ({
    ...meta, id, status: statuses[id],
    evidence: [{ label: "Synthetic fixture", value: "Illustrative " + statuses[id] + " result" }],
    limitation: "This example illustrates the report layout. It does not represent any real device.",
  })),
});
const language = process.argv[3] ?? "en";
const output = process.argv[2] ?? "docs/example-report.html";
await writeReport(output, renderHtmlReport({ snapshot, changes: [], language }));
console.log("Synthetic example created.");
