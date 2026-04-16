
## 2024-05-24 - Remove Dangerous Migration Route
**Vulnerability:** Unauthenticated Express route executing OS commands via child_process.exec.
**Learning:** Development and migration routes must never be exposed in production builds as they represent severe RCE vulnerabilities.
**Prevention:** Remove all internal/testing routes from application code and use dedicated CLI scripts for database migrations.
