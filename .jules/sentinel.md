## 2024-05-15 - [Unauthenticated Shell Command Execution in Internal Routes]
**Vulnerability:** Internal migration route `/api/deals/internal/migrate` executing `child_process.exec` lacked authentication and role-based authorization, allowing potential RCE/command injection or unauthorized database operations by anyone.
**Learning:** Internal tooling routes are often left exposed without proper authentication middleware during rapid development.
**Prevention:** Ensure all routes executing shell commands (`exec`, `spawn`) or administrative tasks are strictly protected with both `authenticateToken` and `authorizeRole('admin')` middleware.
