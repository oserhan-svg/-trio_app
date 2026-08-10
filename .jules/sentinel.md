## 2024-05-18 - Unauthenticated Command Execution Endpoint and Information Leak
**Vulnerability:** The `/internal/migrate` endpoint was completely unauthenticated and exposed internal system state (stdout/stderr) from `child_process.exec`.
**Learning:** Utility or migration endpoints added during development often miss standard authentication wrappers and can leak environment details if raw command output is returned.
**Prevention:** Always secure internal utility endpoints with `isAdmin` middleware and sanitize command output (never return stdout/stderr directly to the client).
