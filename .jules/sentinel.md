## 2024-03-24 - Command Injection Risk via Migration Endpoint
**Vulnerability:** A route `/internal/migrate` exposed `exec()` allowing server command execution via `dealController.runInternalMigration`.
**Learning:** Development/migration endpoints should not be exposed via HTTP endpoints, especially unauthenticated or using `exec()` directly, as this risks command injection and unauthorized server modifications.
**Prevention:** Remove exposed administrative endpoints. Migrations should be handled via CI/CD pipelines or authenticated deployment scripts, never via REST endpoints.