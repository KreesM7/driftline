# Perspective research workbook

Research date: 2026-10-06. This is a manual, bounded adaptation of [STORM](https://arxiv.org/abs/2402.14207), not execution of Stanford's software, a PhD study, or a user survey. The paper expands STORM as “Synthesis of Topic Outlines through Retrieval and Multi-perspective Question Asking.”

This workbook organizes the retrieved evidence into 60 initial questions and shared recursive branches. Searches were grouped by topic; there were not 60 independent searches or interviews. Every root links to three subsequent question/answer levels (F → G → V). Shared branches avoid repeating the same research. Source-backed facts, design inferences, and unresolved demand are distinguished.

## Questions and falsifiers

| Research question | Working hypothesis | What would disprove it? |
| --- | --- | --- |
| Which task deserves a small public tool? | Basic maintenance merits an accessible routine. | Target users cannot identify a useful next action from its results. |
| Is local drift tracking an actual gap? | A narrow, understandable baseline can complement existing tools. | A maintained equivalent already serves these users with less friction. |
| Can beginners run it safely? | Read-only, bounded checks and honest Unknowns reduce tool-created risk. | Untrusted input executes code, checks change settings, or reports imply false safety. |
| Can one schema span operating systems? | Statuses can be common while evidence remains platform-specific. | Native tests show systematic wrong results or unusably high Unknown rates. |
| Is daily use justified? | Teams might check after changes; individuals may prefer weekly checks. | Four-week observation shows no recurring value. Daily demand remains unverified. |
| Can the project remain maintainable? | Five controls and no runtime packages keep scope small. | OS changes impose more maintenance than contributors can sustain. |

The broader original hypothesis included accounts, backups, and recovery. Those needs are not dismissed, but reliable collection would require sensitive access or subjective questionnaires; v1 does not inspect them.

## Source register

Grades concern the cited fact, not proof of Driftline demand. Access date for all links: 2026-10-06. Publication dates are included when established; otherwise the source is a current documentation snapshot.

| ID | Source | Grade | Date / bias / constraint |
| --- | --- | --- | --- |
| S1 | [NIST SMB CSF guide](https://csrc.nist.gov/pubs/sp/1300/final) | Strong | 2024; authoritative guidance, not demand measurements. |
| S2 | [NIST preventive patch maintenance](https://csrc.nist.gov/pubs/sp/800/40/r4/final) | Strong | April 2022; process guidance, not a required CLI cadence. |
| S3 | [CISA everyday guidance](https://www.cisa.gov/secure-our-world) | Strong, historical | Page now archived; no current endorsement inferred. |
| S4 | [Verizon SMB incident snapshot](https://www.verizon.com/business/resources/infographics/2025-dbir-small-business-snapshot.pdf) | Strong for its dataset | 2025; vendor/contributor selection bias; not all businesses. |
| S5 | [Furnell, Usable Cybersecurity](https://academic.oup.com/iwc/article/36/1/3/7585467) | Moderate | 2024; HCI synthesis, not this product's usability trial. |
| S6 | [Wazuh quickstart](https://documentation.wazuh.com/current/quickstart.html) | Strong | Vendor documentation; measures its infrastructure requirements, not abandonment. |
| S7 | [Greenbone container guide](https://greenbone.github.io/docs/latest/22.4/container/) | Strong | Project documentation; deployment complexity does not imply low quality. |
| S8 | [Lynis getting started](https://cisofy.com/documentation/lynis/get-started/) | Strong | Project documentation; Unix-like audit scope. |
| S9 | [Trivy air-gap operation](https://trivy.dev/docs/latest/guide/advanced/air-gap/) | Strong | Project documentation; software scans need prepared databases/configuration. |
| S10 | [MITRE remote services T1021](https://attack.mitre.org/techniques/T1021/) | Strong | Version observed 1.6, modified 2025-10-24; abuse taxonomy, not a vulnerability verdict. |
| S11 | [Ubuntu SSH socket activation](https://discourse.ubuntu.com/t/sshd-now-uses-socket-based-activation-ubuntu-22-10-and-later/30189/1) | Strong | August 2022; project explanation; distributions differ. |
| S12 | [W3C HTML direction](https://www.w3.org/International/questions/qa-html-dir) | Strong | Standards-oriented guidance; not translation validation. |
| S13 | [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | Strong | Living catalog; matching software accurately is still required. |
| S14 | [Defender for Business](https://learn.microsoft.com/en-us/defender-business/mdb-overview) | Strong for features | Vendor documentation; commercial managed protection, not equivalent scope. |
| S15 | [Lynis newcomer concern #264](https://github.com/CISOfy/lynis/issues/264) | Weak | 2016; one old selected anecdote. |
| S16 | [Lynis false-positive issue #1782](https://github.com/CISOfy/lynis/issues/1782) | Weak | 2026; one selected issue, no prevalence estimate. |
| S17 | [Windows firewall policy stores](https://learn.microsoft.com/en-us/powershell/module/netsecurity/get-netfirewallprofile?view=windowsserver2025-ps) | Strong | Official API documentation; ActiveStore is resultant applied policy. |
| T | [Local validation](VALIDATION.md), tests and implementation | Direct for executed cases | Synthetic fixtures/one Windows host; not population accuracy. |

## Initial perspective questions

F = source-backed finding; D = design inference; U = unverified. Source IDs above support the terse answers. A branch identifier means root → that F-node → its G-node → its V-node.

### SMB owner

| # | Question | Answer / evidence | Branch |
| --- | --- | --- | --- |
| B1 | What should a small organization prioritize? | F: risk-based basic safeguards, not one universal score (S1, S3). | F1 |
| B2 | Do common incidents justify device hygiene? | F: intrusion appears in the SMB incident dataset; posture alone misses social/web attacks (S4). | F1 |
| B3 | Is a server necessary for a first check? | D: no; local checks avoid platform setup (S6, T). | F2 |
| B4 | Can this replace managed protection? | F: no; Defender offers broader protection/management (S14). | F8 |
| B5 | Is an enabled remote service always bad? | F: legitimate services also have abuse potential (S10). | F5 |
| B6 | Should the tool automatically fix settings? | D: not initially; business dependencies could break (S1). | F3 |
| B7 | Can reports prove compliance? | D: five signals cannot establish framework coverage (S1, T). | F8 |
| B8 | Must a device be checked daily? | U: no observed adoption/cadence data (S2). | F9 |
| B9 | Can reports leave the business automatically? | D: no automatic sharing; local export only (T). | F6 |
| B10 | What would justify adopting this? | U: useful action with less effort than native settings, tested with real users. | F9 |

### Sysadmin

| # | Question | Answer / evidence | Branch |
| --- | --- | --- | --- |
| A1 | Will missing privileges mean failure? | D: Unknown, not an invented failure/pass (T). | F4 |
| A2 | Are installed updates established by service state? | D: no; service state is not patch inventory (S2, T). | F4 |
| A3 | Can stopped sshd still accept connections? | F: socket activation can start it on demand (S11). | F5 |
| A4 | Which firewall policy should Windows read? | F: ActiveStore captures resultant applied policy (S17). | F4 |
| A5 | Does a firewall switch prove rules are safe? | D: no; profiles are a narrow signal (S17, T). | F4 |
| A6 | Is any encrypted Linux volume enough? | D: no; require root ancestry, and state the limitation (T). | F4 |
| A7 | Can I compare evidence, not just status? | D: canonical status/evidence deltas are useful (T). | F7 |
| A8 | Can several processes share a baseline? | F: no lock is implemented; one process per directory (T). | F7 |
| A9 | Can JSON become a fleet compliance gate? | D: not yet; current exit code indicates execution, not security (T). | F8 |
| A10 | What is the regression obligation? | D: sanitized command fixtures plus native matrix testing (T). | F10 |

### Student / beginner

| # | Question | Answer / evidence | Branch |
| --- | --- | --- | --- |
| L1 | Can I run this without a SOC lab? | F: direct Node execution needs no server/runtime packages (T); contrast S6. | F2 |
| L2 | Does Pass mean my computer is secure? | D: no; only the labeled signal matched (S1, T). | F8 |
| L3 | Is Unknown something I must fix? | D: it describes missing evidence, not a failed safeguard (T). | F4 |
| L4 | Will it change my computer? | F: current probes are fixed reads; history is optional local storage (T). | F3 |
| L5 | Why not give a 0–100 score? | D: it would obscure uneven coverage and uncertainty (S5, T). | F1 |
| L6 | Will all warnings be relevant to my laptop? | F: one historical Lynis report found advice overwhelming; generality unproven (S15). | F1 |
| L7 | Can I learn the reason for a result? | D: evidence, scope, and a next step accompany results (S5, T). | F1 |
| L8 | Can I safely share the screenshot? | D: review even minimized reports before sharing (T). | F6 |
| L9 | Will acknowledgement silence a risk? | F: no; it records review without hiding/changing status (T). | F7 |
| L10 | Is this a useful résumé project? | D: yes as demonstrable engineering; no invented users or protection claims. | F10 |

### Solo developer / DevSecOps

| # | Question | Answer / evidence | Branch |
| --- | --- | --- | --- |
| D1 | Should it also scan my dependencies? | D: avoid duplicating Trivy's wider software scope (S9). | F2 |
| D2 | Can offline software scans stay current? | F: air-gap scanners require prepared data; freshness must be explicit (S9). | F4 |
| D3 | Can a CVE severity alone pick my priority? | D: use exploitation/context, but accurate matching is prerequisite (S13). | F4 |
| D4 | Can rules downloaded from strangers execute? | F: no remote rule channel or executable pack exists (T). | F3 |
| D5 | Can packs add arbitrary shell commands? | F: schema rejects executable fields (T). | F3 |
| D6 | Does no npm dependency eliminate supply-chain risk? | D: no; Node, OS tools, Actions and source remain trusted inputs (T). | F10 |
| D7 | Is there a dashboard/API to secure? | F: neither; static reports avoid a listener/auth boundary (T). | F6 |
| D8 | What lets others reproduce an issue? | D: sanitized fixture, version, expected and actual behavior (T). | F10 |
| D9 | Can it run as a scheduled CI gate today? | D: no automatic scheduling or fail-on-Attention contract (T). | F8 |
| D10 | What prevents scope expansion? | D: explicit non-goals and reviewed data-only extension boundaries (T). | F3 |

### SOC learner / auditor

| # | Question | Answer / evidence | Branch |
| --- | --- | --- | --- |
| S1 | Does this detect an intrusion? | F: no event collection/detection; Wazuh has wider scope (S6, T). | F8 |
| S2 | Is a local baseline tamper-proof? | D: no; the same user/compromised host can modify it (T). | F6 |
| S3 | Does remote-access Attention show exploitation? | F: no; ATT&CK describes potential abuse, not this host's compromise (S10). | F5 |
| S4 | Can false-positive complaints prove a market gap? | F: one issue cannot establish prevalence (S16). | F9 |
| S5 | What does an encryption Pass cover? | F: adapter-specific reported protection, not cryptographic assurance (T). | F4 |
| S6 | Does a report preserve forensic chain of custody? | F: no signing/attestation or immutable event history (T). | F8 |
| S7 | Can five controls certify a framework? | D: no; assessments require much broader evidence (S1). | F8 |
| S8 | What matters more than a green screen? | D: honest gaps, scope and actionable changes (S5, T). | F1 |
| S9 | How should accuracy be evaluated? | D: representative native ground truth; fixtures only prove chosen cases (T). | F10 |
| S10 | Should mature scanners be abandoned? | D: no; Greenbone covers deeper vulnerability work (S7). | F2 |

### Non-English / low-resource user

| # | Question | Answer / evidence | Branch |
| --- | --- | --- | --- |
| N1 | Must I create an account? | F: no account or telemetry exists (T). | F6 |
| N2 | Must I remain online? | F: no application network requests; local metadata may be stale (T, S9). | F4 |
| N3 | What hardware must I dedicate? | F: no dedicated server; benchmark excludes child-process memory (T). | F2 |
| N4 | Can my report render Arabic direction properly? | F: HTML dir/lang and logical layout support RTL (S12, T). | F11 |
| N5 | Is every instruction translated? | F: no; only experimental headings/control titles (T). | F11 |
| N6 | Will colored warnings exclude some readers? | D: pair color with words; contrast is not complete accessibility testing (T). | F11 |
| N7 | What if my native command output is localized? | D: unfamiliar formats should become Unknown; native locale tests pending (T). | F10 |
| N8 | Can reports work on a phone? | F: local browser checks found no overflow at 375px (T). | F11 |
| N9 | Does minimal setup prove beginner usability? | D: no; representative first-run trials are needed (S5). | F9 |
| N10 | What if Node is not installed? | F: Node is a prerequisite; installation time was not measured (T). | F2 |

## Recursive level 2: follow-up nodes

| Node | Question spawned by the initial answer | Answer / basis | Next |
| --- | --- | --- | --- |
| F1 | How can prioritization stay understandable? | D: five explained results; avoid an aggregate score. S1/S5 guide this, but usability is unproven. | G1 |
| F2 | What trade-off accompanies simpler installation? | F: narrower local coverage than Wazuh, Greenbone, Lynis, Trivy or Defender (S6–S9, S14, T). | G2 |
| F3 | Which tool-created risks can be avoided now? | D: no remediation, dynamic code, remote rules or services; fixed commands only (T). | G3 |
| F4 | What evidence is sufficient for a narrow claim? | D: known parsed signals with explicit scope, never freshness inferred from service state (S2, S17, T). | G4 |
| F5 | Which remote-access cases falsify a simple check? | F: socket activation contradicts service-only inference; coverage excludes third-party tools (S11, T). | G4 |
| F6 | What remains private but not trustworthy? | D: minimized local files still reveal posture and can be modified by the user/host (T). | G3 |
| F7 | What is enough history for this preview? | D: latest snapshot/diff/acknowledgements, not a forensic ledger (T). | G5 |
| F8 | Which claims must be prohibited? | D: security certification, incident detection, complete fleet coverage or adoption without evidence (S1, S6, T). | G2 |
| F9 | What field evidence would change the decision? | U: compare native settings and competitors in repeated user trials; demand remains open. | G1 |
| F10 | What verification can be performed here? | F: fixtures, real CLI, Windows reads, static guards and browser checks; not native macOS/Linux or remote CI (T). | G4 |
| F11 | How can multilingual/accessibility claims be bounded? | F: RTL is structural; linguistic and assistive-technology validation are separate (S12, T). | G6 |

## Recursive level 3: challenge nodes

| Node | Follow-up question | Answer / contradiction | Next |
| --- | --- | --- | --- |
| G1 | Would recurring use still matter if daily demand fails? | D: post-change/weekly checks may help; no measured cadence or retention is available. | V1 |
| G2 | Is a narrow tool actually better than incumbents? | D: potentially simpler for this task, but unequivocally less capable; no head-to-head trial. | V2 |
| G3 | Does eliminating network/code paths make it secure? | D: no; local permissions, file validation, runtime/source integrity and OS honesty remain boundaries (T). | V3 |
| G4 | Could accepted parsers still give wrong answers? | F: review reproduced four bugs and regression tests now cover them; unseen native variants remain possible (T). | V4 |
| G5 | Could history itself mislead users? | D: acknowledgements must not hide risk; concurrent writers/compromised hosts remain unsupported (T). | V5 |
| G6 | Does RTL/no-overflow prove accessibility? | D: no; translation, screen reader, zoom/keyboard and contrast review need dedicated users (T). | V6 |

## Recursive level 4: stopping criteria / next evidence

| Node | Third follow-up question | Answer / evidence required |
| --- | --- | --- |
| V1 | How would the daily-use hypothesis be tested? | Recruit 10–15 consented users across personas, observe four weeks, measure recurring useful actions and burden. Not performed; no retention claim. |
| V2 | What would make the winner wrong? | Find a maintained equivalent or observe no improvement over native settings/established tooling. Rerun the weighted decision, do not rationalize sunk effort. |
| V3 | What can be proven before public launch? | Current tests bound injection/export/state paths; complete independent SAST/secrets review and native tests remain release gates (T). |
| V4 | What distinguishes fixtures from real accuracy? | Native configurations independently verified in OS settings, across versions/locales/privileges. Current 35-case rubric is synthetic, not population FP/FN (T). |
| V5 | What must change for fleet/forensic use? | Explicit concurrency, authentication/integrity, retention and exit-code design; not silently added to this preview (T). |
| V6 | What enables broader language claims? | Fluent Arabic review and assistive-technology trials; keep the current experimental label until then (T). |

## Community need diagnostic matrix

Frequency is a proposed workflow, not a measured statistic.

| Pain | Perspectives | Strength | Frequency hypothesis | Current tooling gap / response |
| --- | --- | --- | --- | --- |
| Turning guidance into one next action | SMB, beginner | Strong guidance; weak demand evidence | Weekly/post-change | Explain narrow host evidence, no score. |
| Recognizing a configuration change | sysadmin, developer | Direct implementation; untested adoption | Post-change/daily for teams | Local deterministic comparison without infrastructure. |
| Avoiding false reassurance | auditor, beginner | Technical counterexamples + review | Every result | Separate Unknown from Pass and state scope. |
| Resource/setup burden | student, low-resource | Strong documented competitor requirements | First-run/reinstall | No server/runtime packages; Node still required. |
| Keeping posture evidence local | SMB, developer | Design/privacy rationale | Every run | No uploads; minimized state/report still sensitive. |
| Understanding non-English results | non-English user | Strong RTL guidance; no fluent validation | Every report | Partial experimental Arabic, not full localization. |

## Contradictions and unresolved evidence

- SOC/fleet users need richer inventory and integrity; beginners need low setup and minimized collection. v1 chooses the latter and documents the loss.
- Remote services may be essential to IT work. Attention requests review, not automatic disablement.
- Offline privacy competes with current vulnerability/update knowledge. v1 never labels stale/local update information as complete.
- Broad cross-platform marketing conflicts with one native test host. This is a Windows-smoke-tested preview with macOS/Linux fixtures.
- Individual daily use competes with alert fatigue. A measured recurring-use claim is not yet justified.
- GitHub issue mining produced selected anecdotes, not abandonment rates. Stars/last-push are only a maintenance snapshot. No representative Reddit/Hacker News sample or accessible Discord dataset was established.
- Graphify returned no workspace; competing architectures were not actually graphed. The manual graph is an implementation fallback, not equivalent evidence.

See [Research](RESEARCH.md) for candidate weights, SWOT, project/license snapshots and limitations; [Validation](VALIDATION.md) for executed verification.
