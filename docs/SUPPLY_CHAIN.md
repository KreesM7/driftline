# Supply-chain inventory

Driftline 0.1.0: Apache-2.0, with LICENSE and NOTICE. No competitor code was copied. package-lock.json contains only the root package: zero third-party npm runtime or development packages.

This does not eliminate supply-chain trust. Node, native OS tools, the user's PATH/source, browser and CI actions remain dependencies of execution or verification.

| Component | Pin / scope | License evidence inspected 2026-10-06 |
| --- | --- | --- |
| Node.js | Local runtime 24.21.0; package requires >=22 (22 not locally tested) | [Upstream LICENSE](https://github.com/nodejs/node/blob/v24.21.0/LICENSE): Node core MIT terms plus bundled third-party notices. Node is not bundled here. |
| actions/checkout | 3d3c42e5aac5ba805825da76410c181273ba90b1 (v7.0.1); prepared CI | [MIT](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/LICENSE) |
| actions/setup-node | 820762786026740c76f36085b0efc47a31fe5020 (v7.0.0); prepared CI | [MIT](https://github.com/actions/setup-node/blob/820762786026740c76f36085b0efc47a31fe5020/LICENSE) |
| github/codeql-action | c10b8064de6f491fea524254123dbe5e09572f13 (v4.35.1); prepared analysis | [Action MIT](https://github.com/github/codeql-action/blob/c10b8064de6f491fea524254123dbe5e09572f13/LICENSE); downloaded CodeQL tooling has separate terms. |
| node container | 24.21.0-bookworm-slim; development only | Docker unavailable: image contents/digest/license inventory not verified. |
| Native commands | Fixed OS-provided readers | Not distributed in this package; OS/vendor licensing applies. |

`docs/SBOM.spdx.json` is a manual SPDX component inventory for Driftline and the verified local Node runtime. It is not a generated file-level, Node-transitive, OS or Docker SBOM. No independent SPDX validator was run.

Dependabot configuration is prepared for Actions/npm. Keep action pins under review. Do not add downloaded rules, executable packs or dependencies without reviewing authority, necessity, license and test boundaries.

Before a signed public release: establish maintainer identity, source commit, reproducible package inputs, complete scanner evidence, provenance and a verifiable checksum signature. Current local assets are unsigned.
