# Security policy

Local preview for authorized device checks. Not an incident detector or compliance product. A compromised operating system can lie.

When published, use GitHub **Security → Report a vulnerability**. The owner must enable private reporting before launch. No separate security mailbox exists yet. Do not put credentials or full device reports in public issues. Include sanitized reproduction, version, behavior, and impact. No preview response SLA is promised.

Boundaries: fixed read-only commands, bounded output/time, no elevated mode, daemon, executable packs, network fetches, or auto-remediation. CLI values never become probe arguments. Reports escape dynamic HTML and use a restrictive content policy. State validates schema/size, redacts common identifiers, and writes atomically.

Windows storage inherits directory ACLs; POSIX modes are restricted where supported. Same-user malware can change the program, environment, OS responses, or state. A local baseline is not forensic evidence.

Use one process per data directory. Choose export destinations you control. Reports refuse overwrite but are not limited to a fixed directory. See docs/VALIDATION.md for actual verification and remaining limits.
