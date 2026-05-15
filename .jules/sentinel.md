## 2024-05-16 - Prevent Command Injection via Exec
**Vulnerability:** Found an unauthenticated endpoint (`/internal/migrate`) using `child_process.exec` to run shell commands.
**Learning:** Internal tooling routes should never be exposed in production builds without strict auth (or better, removed entirely). `exec` allows arbitrary command execution.
**Prevention:** Remove standalone migration endpoints from web servers. Execute migrations via CI/CD pipelines or dedicated secured CLI tools instead.
