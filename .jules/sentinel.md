## 2026-10-26 - Command Injection via Internal Migrations
**Vulnerability:** A route exposed a controller function (`runInternalMigration`) that executed `prisma migrate dev` via Node.js `child_process.exec()` without any input sanitization or authorization checks.
**Learning:** This is a severe anti-pattern where a database administration function intended for local development environments was bound directly to an API endpoint without protection.
**Prevention:** Never expose shell command execution through web APIs. Use separate CI/CD pipelines, robust CLI tools, or strict administrative endpoints (only with hardcoded, parameterized operations and strict RBAC) for database tasks.
