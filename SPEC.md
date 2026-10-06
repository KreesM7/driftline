# Spec: Driftline

## Objective

Driftline is a local-first, read-only command-line security drift check for a device its user owns or administers. It converts a small set of defensible host signals into plain-language next steps and shows what changed since the prior check. It is for home users, students, developers, and small IT teams that need a low-noise routine—not a vulnerability scanner, SIEM, compliance certificate, or endpoint agent.

Success means a non-administrator can run one command offline, understand `Pass`, `Attention`, `Unknown`, and `Unsupported`, and get a self-contained local report without a server, account, telemetry, or network scan.

## Assumptions and constraints

- Node.js 24 is the verified local runtime; v1 uses ECMAScript modules and Node standard-library APIs only, avoiding a dependency install.
- The user authorized autonomous local build and local commits, but explicitly did **not** authorize publishing or pushing.
- Normal checks are fixed, read-only OS commands with fixed argument lists. Driftline never invokes a shell with user-supplied input.
- The initial supported probes are Windows, macOS, and common Linux environments. A platform can return `Unknown` or `Unsupported`; it must never infer a pass.
- The primary interface is CLI plus a static HTML/Markdown report. There is no web dashboard, listener, background service, executable plug-in, or automatic remediation.

## Commands

```text
node ./bin/driftline.js check [--json] [--no-history]
node ./bin/driftline.js status [--json]
node ./bin/driftline.js report --format html|markdown --output <file>
node ./bin/driftline.js acknowledge <check-id>
node --test
node --check ./bin/driftline.js
```

## Capability map

| Module id | Responsibility | Depends on |
| --- | --- | --- |
| model | Stable check/result schema and statuses | — |
| runner | Bounded fixed-command execution | Node standard library |
| probes | OS-specific, read-only fact collection | runner, model |
| probe evaluators/shared | Converts facts into transparent results | model, control pack |
| state | Atomic local baseline and acknowledgement history | model |
| presentation | Terminal, escaped static HTML/Markdown reports | model, control pack, i18n |
| cli | Parses fixed commands and coordinates workflow | presentation, probes, state |

Build order: model → runner → evaluator/state → probes → presentation → CLI → tests/docs/release files.

## Project structure

```text
bin/             executable CLI entry point
src/             core, probes, state, reports, and presentation
data/packs/      schema-limited, data-only control pack
tests/           unit, contract, integration-style fixture tests
docs/            research, architecture, safety and UX rationale
tasks/           plan and execution checklist
.github/         CI and community templates
```

## Code style

- ESM JavaScript, strict validation at module boundaries, no implicit globals.
- Immutable result objects after construction; `status` is one of `pass`, `attention`, `unknown`, or `unsupported`.
- Every Unknown includes a limitation; each supported control includes a next step. Attention is evidence-backed and scoped where needed.
- Use `execFile`, constant executable names, constant argument arrays, a 5-second timeout, and a bounded stdout/stderr buffer.

```js
export function unknown(id, title, limitation) {
  return {
    id,
    title,
    status: "unknown",
    severity: "info",
    evidence: [],
    nextStep: "Check the operating system settings or ask a trusted administrator.",
    limitation,
  };
}
```

## Testing strategy

- Node's built-in test runner for unit and contract tests.
- Sanitized command-output fixtures for every parser; tests never require administrator access or alter host state.
- Security tests cover report escaping, export-path validation, command allowlisting, state-file permissions, and malformed state recovery.
- Platform CI matrix is prepared for Windows, macOS, and Ubuntu; this environment can only execute the Windows host subset.
- Quality gates: syntax checks, unit tests, static forbidden-pattern scan, and review of report output.

## Boundaries

- Always: validate CLI input, redact host-specific data, run tests before commits, write only to the Driftline state directory or an explicit report path.
- Ask first: add network access, telemetry, dependencies, executable plug-ins, background processes, privileged remediation, or publication.
- Never: scan a network, open ports, enumerate credentials, inspect browser/keychain data, execute untrusted data, claim compliance/security, or return a false all-clear.

## Success criteria

1. `check` runs read-only probes and returns one result per control without crashing on inaccessible OS APIs.
2. A second check identifies a meaningful status/evidence change without retaining raw command output.
3. `--json` is valid JSON and never includes usernames, hostnames, paths, IP addresses, or raw command output.
4. HTML reports escape all dynamic data, use no JavaScript or remote resources, and provide text labels in addition to color.
5. State writes are atomic, restricted to a user data directory, and `--no-history` avoids persistence.
6. Test suite passes with no npm dependencies.

## Non-goals

- CVE matching, KEV lookup, patch installation, hardening, EDR/SIEM, malware detection, network scanning, cloud dashboards, account/MFA inspection, or remote management.
- A claim that five checks make a device secure or compliant.
