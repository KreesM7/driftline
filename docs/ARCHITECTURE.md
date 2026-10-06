# Architecture

```text
fixed OS APIs / fixed native commands
              |
              v
         platform probes
              |
       sanitized facts only
              |
              v
       evaluator + control pack -----> local baseline (atomic JSON)
              |                                  |
              v                                  v
      terminal / JSON / static report <---- changed-control comparison
```

## Trust boundaries

1. OS command output is untrusted input: it is bounded, parsed defensively, and never copied verbatim into state or reports.
2. The state file is untrusted at read time: size/schema are checked. Invalid content causes an actionable error; it is not executed or automatically deleted.
3. CLI arguments are untrusted: report destinations are normalized and never become command arguments.
4. Report text is untrusted: it is HTML-escaped and rendered without JavaScript or remote assets.

## Data-only pack model

`data/packs/core.json` describes control identifiers, titles, severity, and next steps. It cannot add commands, templates, JavaScript, WebAssembly, or URLs that the program fetches. This deliberately substitutes a safe data pack for an executable plug-in system.

## Threat model (STRIDE summary)

| Threat | Response |
| --- | --- |
| Spoofing / false OS claims | State and report label results as best-effort; a compromised host can lie. |
| Tampering | Atomic writes; schema validation; no remote update channel; release-checksum guidance. |
| Repudiation | Snapshot timestamp and tool version are retained locally; no hidden telemetry. |
| Information disclosure | No raw output retained; one summary baseline by default; identifier redaction; explicit report export. |
| Denial of service | 5-second command timeouts and 128 KiB output bounds; parsing failures become `Unknown`. |
| Elevation of privilege | User-mode, read-only commands only; no service, daemon, installer execution, or auto-remediation. |

## Platform checks

| Control | Windows | macOS | Linux | Honest fallback |
| --- | --- | --- | --- | --- |
| Updates | service/reboot markers; no freshness Pass | update schedule; no online catalog | local package metadata; no freshness Pass | `Unknown` |
| Disk encryption | isolated BitLocker query | stable `fdesetup status` | encrypted root ancestor mapper | `Unknown` |
| Firewall | firewall-profile state | application firewall state | UFW/firewalld state | `Unknown` |
| Screen lock | policy/timeout registry values | screensaver lock preferences | no stable desktop-neutral probe | `Unknown` |
| Remote access | RDP policy only | Remote Login / Remote Apple Events | SSH service and socket aliases | `Unknown` |

An `Unknown` result means “Driftline could not verify this safely,” not “the control failed.”

## Module contracts

| Module | Input / output | Acceptance / tests |
| --- | --- | --- |
| model | Result/snapshot objects; normalized immutable snapshots and changes | Valid statuses, unique controls, immutable evidence and deterministic comparison; model tests. |
| control-pack | Fixed local JSON; immutable metadata map | Known fields only, bounded strings/counts, unique IDs; pack tests. |
| runner | Compiled command/arguments; bounded execution result | Allowlisted commands, no shell, timeout/buffer bounds; runner tests. |
| probes | Runner responses; five scoped result objects | Parse known formats; missing/unrecognized evidence stays Unknown; adapter and synthetic corpus tests. |
| state | Trusted directory plus untrusted state bytes; validated snapshot/diff/acknowledgements | Bounded file, schema, minimized text, atomic save; state/integration tests. |
| presentation/i18n | Validated view; text or escaped static document | Status/scope visible, HTML escaping/CSP, RTL structure, no remote assets; report tests/browser checks. |
| cli/bin | Untrusted argument strings; output and exit code | Strict flags, no user-controlled probe arguments, no-history and exclusive exports; CLI/subprocess tests. |

Evaluators live inside platform modules, not a separate universal evaluator. CLI handles JSON serialization. Exit 0 means execution succeeded, even with Attention/Unknown; exit 2 means input/storage/execution error. There is no fleet-gating API contract.
