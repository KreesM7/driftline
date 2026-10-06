import { createSnapshot, diffSnapshots } from "./model.js";
import { collectPlatformProbes } from "./probes/index.js";
import { createRunner } from "./runner.js";
import { createStateStore } from "./state.js";
import { formatTerminal, renderHtmlReport, renderMarkdownReport, writeReport } from "./presentation.js";

export const HELP = [
  "Driftline — private, read-only posture checks for your own device.",
  "",
  "Usage:",
  "  driftline check [--json] [--no-history] [--data-dir PATH]",
  "  driftline status [--json] [--data-dir PATH]",
  "  driftline report --format html|markdown --output FILE [--lang en|ar] [--data-dir PATH]",
  "  driftline acknowledge CHECK-ID [--data-dir PATH]",
  "  driftline --help",
  "",
  "Checks do not change system settings. Unknown means the signal could not be verified.",
  "Reports refuse to overwrite an existing file. Arabic report headings are experimental;",
  "evidence and guidance currently remain in English.",
  "",
].join("\n");

function parseArguments(argv) {
  if (!Array.isArray(argv) || argv.some((arg) => typeof arg !== "string")) {
    throw new Error("Arguments must be strings.");
  }
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "help") {
    return { command: "help" };
  }
  const command = argv[0];
  const supported = {
    check: new Set(["--json", "--no-history", "--data-dir"]),
    status: new Set(["--json", "--data-dir"]),
    report: new Set(["--format", "--output", "--lang", "--data-dir"]),
    acknowledge: new Set(["--data-dir"]),
  };
  if (!Object.hasOwn(supported, command)) {
    throw new Error("Unknown command. Use --help.");
  }
  const options = { command };
  let index = 1;
  if (command === "acknowledge") {
    options.id = argv[index++];
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(options.id ?? "")) {
      throw new Error("A valid check identifier is required.");
    }
  }
  while (index < argv.length) {
    const flag = argv[index++];
    if (!supported[command].has(flag) || Object.hasOwn(options, flag)) {
      throw new Error("Unknown or repeated option. Use --help.");
    }
    if (flag === "--json" || flag === "--no-history") {
      options[flag] = true;
    } else {
      const value = argv[index++];
      if (!value || value.startsWith("--") || value.includes("\0")) {
        throw new Error("An option value is missing or invalid. Use --help.");
      }
      options[flag] = value;
    }
  }
  if (command === "report") {
    if (!["html", "markdown"].includes(options["--format"]) || !options["--output"]) {
      throw new Error("Report requires --format html|markdown and --output FILE.");
    }
    if (options["--lang"] && !["en", "ar"].includes(options["--lang"])) {
      throw new Error("Report language must be en or ar.");
    }
  }
  return options;
}

export async function runCli(argv, dependencies = {}) {
  const options = parseArguments(argv);
  const write = dependencies.write ?? ((text) => process.stdout.write(text));
  if (options.command === "help") {
    write(HELP);
    return 0;
  }
  const now = dependencies.now ?? (() => new Date().toISOString());
  const store = dependencies.store ?? createStateStore({ dataDir: options["--data-dir"] });
  const printView = (view) => write(options["--json"]
    ? JSON.stringify(view, null, 2) + "\n"
    : formatTerminal(view));

  if (options.command === "check") {
    const previous = options["--no-history"] ? { snapshot: null, acknowledgements: {} } : await store.load();
    const platform = dependencies.platform ?? process.platform;
    const results = await (dependencies.collect ?? collectPlatformProbes)(
      platform, dependencies.runner ?? createRunner(),
    );
    const snapshot = createSnapshot({ platform, observedAt: now(), results });
    const changes = diffSnapshots(previous.snapshot, snapshot);
    if (!options["--no-history"]) {
      await store.saveSnapshot(snapshot);
    }
    printView({
      snapshot,
      changes,
      acknowledgements: previous.acknowledgements,
      historySaved: !options["--no-history"],
    });
    return 0;
  }

  const state = await store.load();
  if (!state.snapshot) {
    throw new Error("No local baseline exists. Run check first without --no-history.");
  }
  if (options.command === "status") {
    printView({ snapshot: state.snapshot, changes: state.changes ?? [], acknowledgements: state.acknowledgements });
    return 0;
  }
  if (options.command === "acknowledge") {
    if (!state.snapshot.results.some((result) => result.id === options.id)) {
      throw new Error("Check identifier is not present in the saved baseline.");
    }
    await store.acknowledge(options.id, now());
    write("Acknowledged. The check remains visible and its status is unchanged.\n");
    return 0;
  }
  const view = {
    snapshot: state.snapshot, changes: state.changes ?? [],
    acknowledgements: state.acknowledgements, language: options["--lang"] ?? "en",
  };
  const render = options["--format"] === "html" ? renderHtmlReport : renderMarkdownReport;
  await (dependencies.writeReport ?? writeReport)(options["--output"], render(view));
  write("Local report created.\n");
  return 0;
}
