## 2025-05-20 - Remove Unauthenticated RCE Route
**Vulnerability:** Found an unauthenticated endpoint (`/api/deals/internal/migrate`) executing raw shell commands (`child_process.exec`) with user-supplied arguments implicitly allowed by the execution context.
**Learning:** Internal tooling routes are easily left exposed in production APIs, creating a critical RCE/Command Injection risk if they use `child_process.exec` without strict authentication and authorization.
**Prevention:** Internal/testing routes that execute shell commands or migrations must be completely removed from production builds or, if strictly necessary, protected by both robust authentication (`authenticateToken`) and authorization (`authorizeRole('admin')`).
