# Contributing

Read SPEC.md, docs/ARCHITECTURE.md, and SECURITY.md. Run npm run check, npm run security-check, and npm test.

Keep changes small. Parser changes need sanitized fixtures, OS/command version, exit codes, and regression tests. Pass requires positive evidence for a narrow claim. Ambiguity means Unknown.

Never commit identifiers, secrets, or real host reports. Label synthetic examples. Review new commands for read-only/offline behavior, fixed arguments, limits, and availability. Data packs cannot define executable code or commands.

Explain the user-visible change, tests, and limits in each PR. Arabic needs fluent review and narrow-screen/bidirectional checks. Starter issue drafts are in docs/GOOD_FIRST_ISSUES.md.
