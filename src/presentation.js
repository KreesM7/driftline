import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { summarizeResults } from "./model.js";
import { CONTROL_META } from "./control-pack.js";
import { STRINGS } from "./i18n.js";

function safeText(value) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ");
}

function escapeHtml(value) {
  return safeText(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function escapeMarkdown(value) {
  return safeText(value)
    .replaceAll("\\", "\\\\")
    .replaceAll(String.fromCharCode(96), "\\" + String.fromCharCode(96))
    .replace(/([*_\[\]<>])/g, "\\$1");
}

function headingFor(result, language = "en") {
  return STRINGS[language][result.status] ?? STRINGS[language].unknown;
}

function titleFor(result, language) {
  return language === "ar" ? CONTROL_META[result.id]?.titleAr ?? result.title : result.title;
}

function statusSummary(results, language = "en") {
  const summary = summarizeResults(results);
  return ["pass", "attention", "unknown", "unsupported"]
    .map((status) => STRINGS[language][status] + ": " + summary[status]).join(" | ");
}

function changeFor(result, changes) {
  const change = changes.find((item) => item.id === result.id);
  if (!change) {
    return null;
  }
  return {
    from: change.before ?? change.from ?? "not-observed",
    to: change.after ?? change.to ?? result.status,
  };
}

export function formatTerminal({ snapshot, changes = [], acknowledgements = {} }) {
  const lines = [
    "Driftline local posture check — " + safeText(snapshot.platform),
    "Observed: " + safeText(snapshot.observedAt),
    statusSummary(snapshot.results),
    "Changes since previous check: " + changes.length,
    ...changes.map((change) => "  " + safeText(change.id) + ": " +
      (change.kind === "evidence" ? "Observed evidence changed" : safeText(change.before) + " → " + safeText(change.after))),
    "",
  ];

  for (const result of snapshot.results) {
    lines.push(
      "[" + headingFor(result).toUpperCase() + " / " + result.severity.toUpperCase() + "] " + safeText(result.title),
    );
    for (const evidence of result.evidence) {
      lines.push("  - " + safeText(evidence.label) + ": " + safeText(evidence.value));
    }
    const change = changeFor(result, changes);
    if (change) {
      lines.push("  Change: " + safeText(change.from) + " → " + safeText(change.to));
    }
    lines.push("  Next: " + safeText(result.nextStep));
    if (result.limitation) {
      lines.push("  Limit: " + safeText(result.limitation));
    }
    if (acknowledgements[result.id]) {
      lines.push("  Acknowledged: " + safeText(acknowledgements[result.id]) + " (status unchanged)");
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

function resultHtml(result, changes, language, acknowledgements) {
  const strings = STRINGS[language];
  const change = changeFor(result, changes);
  const evidence = result.evidence
    .map((item) => "<li><strong>" + escapeHtml(item.label) + ":</strong> " + escapeHtml(item.value) + "</li>")
    .join("");
  const changeHtml = change
    ? "<p><strong>" + strings.changed + ":</strong> <bdi>" + escapeHtml(change.from) + " → " + escapeHtml(change.to) + "</bdi></p>"
    : "";

  return [
    '<article class="check status-' + escapeHtml(result.status) + '">',
    "<h2>" + escapeHtml(headingFor(result, language)) + ": " + escapeHtml(titleFor(result, language)) + "</h2>",
    "<p><strong>" + strings.priority + ":</strong> <bdi>" + escapeHtml(result.severity) + "</bdi></p>",
    "<h3>" + strings.observed + "</h3>",
    "<ul>" + evidence + "</ul>",
    changeHtml,
    "<p><strong>" + strings.next + ":</strong> <bdi>" + escapeHtml(result.nextStep) + "</bdi></p>",
    result.limitation ? "<p><strong>" + strings.limitation + ":</strong> <bdi>" + escapeHtml(result.limitation) + "</bdi></p>" : "",
    acknowledgements[result.id] ? "<p>" + strings.acknowledged + ": <bdi>" + escapeHtml(acknowledgements[result.id]) + "</bdi></p>" : "",
    "</article>",
  ].join("\n");
}

export function renderHtmlReport({ snapshot, changes = [], language = "en", acknowledgements = {} }) {
  if (!Object.hasOwn(STRINGS, language)) {
    throw new Error("Unsupported report language.");
  }
  const strings = STRINGS[language];
  const dir = language === "ar" ? "rtl" : "ltr";
  const summary = statusSummary(snapshot.results, language);
  const checks = snapshot.results.map((result) => resultHtml(result, changes, language, acknowledgements)).join("\n");

  return [
    "<!doctype html>",
    '<html lang="' + language + '" dir="' + dir + '">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta http-equiv="Content-Security-Policy" content="default-src ' + "'none'" + '; style-src ' + "'unsafe-inline'" + '; base-uri ' + "'none'" + '; form-action ' + "'none'" + '">',
    "<title>" + strings.report + "</title>",
    "<style>",
    ":root { color-scheme: light; font-family: system-ui, sans-serif; color: #172331; background: #f5f7fa; }",
    "body { line-height: 1.5; margin: 0 auto; max-width: 58rem; padding: 1.5rem; }",
    "header, article { border: 1px solid currentColor; border-radius: .5rem; margin-block: 1rem; padding: 1rem; }",
    ".status-attention { border-inline-start: .5rem solid #a84200; }",
    ".status-pass { border-inline-start: .5rem solid #18794e; }",
    ".status-unknown, .status-unsupported { border-inline-start: .5rem solid #6b7280; }",
    "h1, h2, h3 { line-height: 1.2; }",
    "bdi, li { overflow-wrap: anywhere; }",
    "article, header { background: #fff; }",
    "@media print { body { max-width: none; } }",
    "</style>",
    "</head>",
    "<body>",
    "<header>",
    "<h1>" + strings.report + "</h1>",
    "<p><strong>" + strings.platform + ":</strong> <bdi>" + escapeHtml(snapshot.platform) + "</bdi></p>",
    "<p><strong>" + strings.observed + ":</strong> <bdi>" + escapeHtml(snapshot.observedAt) + "</bdi></p>",
    "<p>" + escapeHtml(summary) + "</p>",
    "<p>This local, read-only check is not a security certification or compromise assessment.</p>",
    language === "ar" ? "<p dir=\"ltr\">Experimental Arabic headings. Evidence and guidance remain in English.</p>" : "",
    "<p>" + strings.changed + ": " + changes.length + "</p>",
    "<ul>" + changes.map((item) => "<li><bdi>" + escapeHtml(item.id) + ": " +
      escapeHtml(item.kind === "evidence" ? "Observed evidence changed" : item.before + " → " + item.after) + "</bdi></li>").join("") + "</ul>",
    "</header>",
    "<main>",
    checks,
    "</main>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

export function renderMarkdownReport({ snapshot, changes = [], language = "en" }) {
  if (!Object.hasOwn(STRINGS, language)) {
    throw new Error("Unsupported report language.");
  }
  const lines = [
    "# " + STRINGS[language].report,
    "",
    "- Platform: " + escapeMarkdown(snapshot.platform),
    "- Observed: " + escapeMarkdown(snapshot.observedAt),
    "- " + escapeMarkdown(statusSummary(snapshot.results)),
    "",
    "This local, read-only check is not a security certification or compromise assessment.",
    "Changes since previous check: " + changes.length,
    ...changes.map((item) => "- " + escapeMarkdown(item.id) + ": " +
      escapeMarkdown(item.kind === "evidence" ? "Observed evidence changed" : item.before + " → " + item.after)),
    "",
  ];

  for (const result of snapshot.results) {
    lines.push("## " + headingFor(result, language) + " (" + escapeMarkdown(result.severity) + "): " + escapeMarkdown(titleFor(result, language)));
    lines.push("");
    for (const evidence of result.evidence) {
      lines.push("- " + escapeMarkdown(evidence.label) + ": " + escapeMarkdown(evidence.value));
    }
    const change = changeFor(result, changes);
    if (change) {
      lines.push("- Changed: " + escapeMarkdown(change.from) + " → " + escapeMarkdown(change.to));
    }
    lines.push("- Suggested next step: " + escapeMarkdown(result.nextStep));
    if (result.limitation) {
      lines.push("- Limit: " + escapeMarkdown(result.limitation));
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function writeReport(outputPath, content) {
  if (!outputPath || typeof outputPath !== "string") {
    throw new Error("A report output path is required.");
  }

  const absolutePath = resolve(outputPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, { encoding: "utf8", flag: "wx", mode: 0o600 });
  return absolutePath;
}
