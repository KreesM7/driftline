# Research Dossier (condensed)

## Decision

**Driftline** is a local endpoint-hygiene delta coach. A subjective weighted decision model selected it over phishing, network, dependency, and mini-SIEM ideas. Scores are evidence-informed design judgments, not measured demand.

This is an evidence-backed product hypothesis, not proof of product-market fit. The strongest falsifier is a maintained, cross-platform, local, beginner-readable tool that already offers low-noise drift tracking and action explanations; no such equivalent was found in this bounded research pass.

## Evidence quality

| Claim | Evidence | Grade | Caveat |
| --- | --- | --- | --- |
| Under-resourced organizations need accessible cyber-risk prioritization. | [NIST CSF 2.0 Small Business Quick-Start Guide](https://csrc.nist.gov/pubs/sp/1300/final), 2024 | Strong | Guidance, not a product-demand survey. |
| Updates, MFA, passwords, and phishing recognition are high-value everyday actions. | [CISA Secure Our World](https://www.cisa.gov/secure-our-world), accessed 2026-10-06 | Strong | Public guidance, not prevalence data. |
| Small-business breach patterns are dominated by system intrusion, social engineering, and web-app attacks. | [Verizon 2025 DBIR SMB snapshot](https://www.verizon.com/business/resources/infographics/2025-dbir-small-business-snapshot.pdf), 2025 | Strong | Vendor incident data has collection bias. |
| Known-exploited vulnerabilities should be a prioritization input. | [CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog), accessed 2026-10-06 | Strong | Does not justify generic CVE matching. |
| Cybersecurity safeguards need usable interaction to be adopted correctly. | [Furnell, *Usable Cybersecurity*](https://academic.oup.com/iwc/article/36/1/3/7585467), 2024 | Moderate | Broad HCI analysis, not Driftline-specific validation. |
| Heavy platforms create real onboarding/resource friction. | [Wazuh quickstart](https://documentation.wazuh.com/current/quickstart.html), [Greenbone containers](https://greenbone.github.io/docs/latest/22.4/container/) | Strong | Does not prove they are unsuitable for every small team. |
| Existing audits can create platform-specific false positives. | [Lynis issue #1782](https://github.com/CISOfy/lynis/issues/1782), 2026 | Weak | A single issue; used only as a design warning. |

## Community Need Diagnostic Matrix

| Need | Personas | Strength | Existing-tool gap | Driftline response |
| --- | --- | --- | --- | --- |
| Prioritize simple, high-value device hygiene | beginner, student, SMB owner | Strong | guidance is scattered; deep auditors are noisy | five transparent controls and next steps |
| Repeated, low-infrastructure posture evidence | sysadmin, solo developer, small IT team | Moderate–strong | Wazuh/Greenbone require substantial setup | local status baseline and delta report |
| Cross-platform beginner-friendly posture view | student, home user, auditor | Moderate | Lynis excludes Windows; OS-specific tools vary | one schema with platform-scoped `Unknown` states |
| Privacy-respecting checks | everyone | Moderate | cloud/credentialed tools can widen exposure | no account, telemetry, scan, listener, or remote fetch |

## Perspective questions (sampled STORM chain)

| Perspective | Initial question | Follow-up 1 | Follow-up 2 | Outcome |
| --- | --- | --- | --- | --- |
| SMB owner | What must I fix first? | Which controls reduce common exposure? | Can I show progress without hiring a SOC? | Prioritized local evidence, not a framework clone. |
| Student | Can I check my laptop without learning a SIEM? | Will it be safe to run? | Can it teach why a result matters? | Read-only, plain-language command/report. |
| Sysadmin | Can this be used daily with low noise? | How are false positives handled? | Can I automate the output? | Stable JSON, deltas, `Unknown`, no false pass. |
| Solo developer | Does it duplicate CI scanners? | Could it inspect secrets/dependencies? | What does that require? | Reject broad SCA; focus on endpoint posture. |
| SOC learner | Does it detect compromise? | What evidence is retained? | Can results be trusted during an incident? | Explicitly no: posture support, not forensic integrity. |
| Nontechnical/low-resource user | Does it upload my data? | Does it change settings? | Can I understand uncertainty? | No upload/change; report limitations plainly. |

## Landscape and rejected alternatives

| Candidate | Score / 5 | Decision |
| --- | ---: | --- |
| Local endpoint hygiene delta coach | 4.55 | Selected |
| Developer dependency digest | 3.65 | Mature alternatives dominate |
| Privacy phishing coach | 3.45 | Valuable but usually on-demand, not daily |
| Mini-SIEM | 3.50 | Operational burden is too high |
| Network vulnerability scanner | 2.85 | Authorization and maintenance risk |

Competitors: Wazuh is a mature central XDR/SIEM with a server, indexer, and dashboard; its own quickstart recommends 4 vCPU, 8 GiB RAM, and 50 GB for 1–25 agents. Greenbone requires container/architecture knowledge and substantial storage. Lynis is a useful Unix-like audit tool but does not support Windows and uses report/log-oriented workflow. These are not failures; they explain why Driftline deliberately targets a much narrower local routine. Sources: [Wazuh](https://documentation.wazuh.com/current/quickstart.html), [Greenbone](https://greenbone.github.io/docs/latest/22.4/container/), [Lynis](https://cisofy.com/documentation/lynis/get-started/).

## Research limitations

- GitHub issues and discussions are qualitative signals, not representative abandonment statistics.
- Discord communities were not accessible in this environment; no claim relies on them.
- This project does not prove daily adoption. Validate with 10–15 users across the named personas before making adoption claims.
- CISA KEV enrichment is intentionally deferred until exact package/version matching and feed provenance can be implemented safely.

The CISA Secure Our World page is now labeled archived. Treat it as historical guidance; triangulate with NIST and OS documentation rather than claiming current program endorsement.

## Candidate scoring and SWOT

Weights: impact 30%, frequency 20%, feasibility 20%, differentiation 10%, safety 10%, maintenance ease 10%. Scores use 1–5; higher is better. Frequency is a hypothesis.

| Candidate | Impact | Frequency | Feasibility | Difference | Safety | Maintenance | Weighted |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Driftline | 5 | 4 | 5 | 3.5 | 5 | 4 | 4.55 |
| Dependency digest | 4 | 4 | 4 | 2.5 | 4 | 2 | 3.65 |
| Phishing coach | 4 | 2 | 4 | 3.5 | 4 | 3 | 3.45 |
| Mini-SIEM | 4 | 5 | 3 | 2 | 3 | 2 | 3.50 |
| Network scanner | 3.5 | 3 | 3 | 1.5 | 2 | 2.5 | 2.85 |

| Candidate | Strength | Weakness | Opportunity | Threat |
| --- | --- | --- | --- | --- |
| Driftline | Small local workflow | Five signals; many Unknowns | Explain changes | Native settings may suffice |
| Dependency digest | Software evidence | Mature incumbents | Prioritization | Database maintenance |
| Phishing coach | Clear public problem | Freshness uncertainty | Teach safe triage | False reassurance/privacy |
| Mini-SIEM | Frequent analyst use | Operations burden | Teaching labs | Alert overload |
| Network scanner | Infrastructure utility | Authorization complexity | Simple reports | Misuse/false positives |

Lowering Driftline's frequency from 4 to 2 gives 4.15. Subjective weights and an incomplete landscape can still be wrong. Weekly/post-change use may be more credible for individuals; daily adoption requires longitudinal evidence.

## Maintained project snapshot

GitHub connector inspected these repository APIs on 2026-10-06. Stars are a snapshot, not adoption/quality proof. All five were unarchived. No competitor code was copied.

| Repository | Stars | Last push observed (UTC) | API license |
| --- | ---: | --- | --- |
| [Lynis](https://github.com/CISOfy/lynis) | 16,438 | 2026-09-16 | GPL-3.0 |
| [Wazuh](https://github.com/wazuh/wazuh) | 17,131 | 2026-10-06 | Other/NOASSERTION; inspect components before reuse |
| [Trivy](https://github.com/aquasecurity/trivy) | 38,262 | 2026-10-06 | Apache-2.0 |
| [Prowler](https://github.com/prowler-cloud/prowler) | 14,967 | 2026-10-06 | Apache-2.0 |
| [OpenVAS](https://github.com/greenbone/openvas-scanner) | 4,853 | 2026-10-06 | GPL-2.0 |

[Trivy's air-gap documentation](https://trivy.dev/docs/latest/guide/advanced/air-gap/) describes vulnerability database/configuration requirements. It has broader software-vulnerability coverage than Driftline. [Microsoft Defender for Business](https://learn.microsoft.com/en-us/defender-business/mdb-overview) offers commercial endpoint protection, central management, and EDR. Driftline is not comparable protection. Prices and representative abandonment rates were not established.

## Triangulation and negative evidence

[NIST patch management](https://csrc.nist.gov/pubs/sp/800/40/r4/final), April 2022, supports ongoing preventive maintenance, not demand for a daily CLI. [MITRE T1021](https://attack.mitre.org/techniques/T1021/), inspected 2026-10-06, documents legitimate remote services and their abuse; it supports context-sensitive review, not a blanket vulnerability verdict.

[Ubuntu socket activation](https://discourse.ubuntu.com/t/sshd-now-uses-socket-based-activation-ubuntu-22-10-and-later/30189/1), August 2022, falsified an early service-only check. Regression coverage now includes sockets. This is stronger technical evidence than community complaints.

Reddit/Stack Exchange results signal SSH/scanner confusion but are selected anecdotes, not prevalence estimates. No representative Discord or Hacker News demand dataset was established. NVD's CVSS page returned no usable content in this continuation; no new claim depends on it.

The perspective workbook records 60 initial questions with source-mapped answers and follow-up chains. This is a manual STORM-style adaptation, not a run of Stanford's software or a completed academic study.
