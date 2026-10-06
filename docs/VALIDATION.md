# Validation and limitations

Local preview 0.1.0, verified 2026-10-06 on Windows with Node 24.21.0. This is an executed test record, not security certification.

## Executed verification

| Journey / check | Outcome | Evidence scope |
| --- | --- | --- |
| Schema, control metadata, state/diff, runner, three adapters, reports, CLI | 29 tests passed, 0 failed; 357.65ms final observed suite | Sanitized fixtures, injected failures and subprocess tests. |
| Real CLI status and HTML export | Correct saved delta; second export rejected without changing original | Temporary synthetic baseline; no real host report retained. |
| Read-only Windows check, no history | Five results without a crash; unavailable signals remained Unknown | One native host; not an independent configuration accuracy study. |
| HTML in actual headless Chrome | English 1000px/375px and Arabic 375px: no horizontal overflow, five cards, one main heading, zero scripts | Real local files; zero attempted external requests and no page errors. |
| Windows installer / help / uninstall | Passed in a dedicated temporary workspace prefix; registration removed | Not a machine-wide installation or protected-directory test. |
| Installer syntax | PowerShell parser and Git Bash `-n` passed | POSIX installer not installed on native macOS/Linux. |
| Syntax / whitespace / local imports / cycles | Passed across 29 JavaScript files | Custom bounded checks, not a full linter/type checker or dead-code analyzer. |
| Limited SAST / secret-pattern guards | Passed | Selected patterns only; not comprehensive SAST or secret detection. |
| npm audit | Zero package vulnerabilities reported | There are zero external npm packages; does not audit application logic or Node/OS. |
| Independent security review | Four concrete parser defects reproduced, fixed and regression-tested | Separate reviewer model; scope covered CLI/state/commands/reports/probes. |

Review fixes: all SSH service/socket aliases; anchored numeric apt counts; stable FileVault output rather than transitions; whitespace-normalized macOS boolean output. Additional self-review fixed unrelated-volume encryption inference, update-service false reassurance, evidence-change tracking, Windows bundle timeout isolation, report overwrite and export escaping. Windows firewall now reads ActiveStore; all adapters disclose narrow remote/firewall scope.

Sandbox file rename/symlink restrictions initially caused EPERM. Tests/install verification passed when run outside that restricted sandbox. That observation does not establish behavior on every Windows filesystem.

## False positives / false negatives

`tests/probe-corpus.test.js` evaluates **35 synthetic, signal-level cases**: 11 expected Pass, 13 expected Attention, 11 expected Unknown.

- Fixture false positive: Attention where the rubric expects Pass: **0/11**.
- Fixture false negative: Pass where the rubric expects Attention: **0/13**.
- Unsafe fixture all-clear: Pass where the rubric expects Unknown: **0/11**.
- All 35 statuses matched the authored rubric.

These are deliberately selected developer fixtures, not blinded observations or representative devices. The rubric concerns limited signal interpretation, not whether a computer is secure. It excludes real-world prevalence, unsupported controls, and unfamiliar OS/locale variants. **Operational false-positive/false-negative rates are unknown.** Do not advertise these fixture counts as product accuracy.

## Speed / memory

Three consecutive Windows read-only/no-history runs after final probe tightening:

| Sample | Wall seconds | Sampled peak main-process RSS |
| --- | ---: | ---: |
| 1 | 6.288 | 43.73 MiB |
| 2 | 5.916 | 44.41 MiB |
| 3 | 5.897 | 43.88 MiB |

Median: 5.916 seconds. Main RSS sampled every 10ms; OS command subprocess memory is **excluded**. These are not total-memory or cross-platform guarantees. Reproduce with `npm run benchmark`; it performs real local checks, emits aggregate timing/memory only, and saves no history.

Each command is bounded to five seconds and 128KiB output. Platform work contains multiple commands; this is not a global five-second deadline. The design budget is under 15 seconds for common runs and under 64MiB main-process RSS on this host. Linux's sequential service queries can exceed that time when commands stall; native benchmarking is pending.

## Security boundaries reviewed

- CLI options never flow into native command arguments; commands use no shell and hide native Windows windows.
- Fixed command names resolve through the user's environment/PATH. Same-user tampering is outside the integrity guarantee.
- Data-only packs reject unexpected executable fields. No downloaded packs or arbitrary execution.
- State validates schema/size and rejects nonregular/symlink state files. Atomic writes limit partial snapshots; no cross-process lock.
- POSIX state modes are restricted where supported; Windows inherits parent ACLs. Do not choose shared/untrusted directories.
- Export uses exclusive creation and escapes dynamic report text. Parent directory symlinks are not prohibited; users choose destinations they control.
- Fixed summaries avoid raw host output. Pattern redaction is defense in depth, not proof that every possible sensitive string can be recognized.
- Reports have restrictive CSP, no JavaScript or remote resources. A compromised browser/OS is not defended.

## What remains unverified

Native macOS/Linux collection and install/uninstall; Node 22 runtime; non-English native command formats; filesystem/permission variants; assistive technologies/fluent Arabic; representative usability/adoption; comprehensive SAST/secrets audit; remote Actions/CodeQL; Docker image availability/build/digest; release identity/name availability/signing.

No YAML parser was available in the bundled runtime; workflow indentation, fields and pinned actions were manually reviewed, not remotely validated. GitHub CI and CodeQL are prepared, not passed. Docker is unavailable locally. No source/package publication or deployment occurred.

## Comparison: where it is and is not better

For a five-signal local routine, this implementation requires no server/account/runtime packages, records changes, and exports static reports. That is an implementation property, **not measured superiority** in usability, resources or security against competitors.

Lynis provides broader Unix auditing; Wazuh offers managed detection/infrastructure; Greenbone scans vulnerabilities; Trivy covers software vulnerabilities; commercial managed products offer protection and fleet management. Driftline does none of that. [Research references and scope](RESEARCH.md).

Before public launch, run the pending native/security gates. Before any accuracy or daily-use claims, establish independently labeled device configurations and longitudinal consented user observations.
