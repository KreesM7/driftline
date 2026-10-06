# Public source preview: Driftline 0.1.0

Private read-only posture checks with evidence and changes. Includes platform adapters, terminal/JSON, baselines, acknowledgements, static reports, and experimental Arabic headings.

Public source: https://github.com/KreesM7/driftline. No registry package, signed tag,
or binary release is published. No signing/notarization occurred.

Windows temporary-prefix install/help/uninstall passed locally. Before public release: native macOS/Linux checks/installers; Docker build/digest; remote CI/CodeQL; complete secrets/SAST scan; private vulnerability reporting; branch protection; name availability review.

Local archives contain the preview source/package. SHA-256 checksums are provided separately; they are not signatures. No real host reports or local routing/task transcripts are included.

## Signed-release guidance

Package a clean reviewed commit. Publish SHA-256 checksums, source commit, SBOM/license manifest, provenance, and a checksum signature made with the maintainer's established signing identity. Provide verification instructions and a trusted way to obtain the public key.

A checksum beside an untrusted download is not independent authentication. Never label a release signed without a verifiable signature. Authenticode/notarization require real publisher credentials.

Actions use verified commit pins. Review updates. Docker is version-pinned, not digest-pinned; verify its digest before reproducibility claims.

## Draft launch post

I built Driftline, a free local tool that explains a few useful security signals on your own computer and shows changes since your last check. No account or runtime packages. It never changes system settings.

The preview includes terminal/JSON and local reports. It reports uncertainty openly. Windows has a live smoke check; macOS/Linux validation and translations are welcome. I am looking for people to test whether it helps them take a useful next step.

## Résumé wording

Built Driftline, a dependency-free security posture CLI with platform adapters, validated local history, status/evidence drift, escaped reports, regression tests, and prepared cross-platform CI. Documented threat boundaries and platform limitations.

Do not claim production users, measured adoption, complete OS coverage, or incident detection without evidence.
