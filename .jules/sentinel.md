## 2024-05-24 - Unprotected Internal Migration Route
**Vulnerability:** Found an unauthenticated internal route (`/internal/migrate`) executing `child_process.exec`.
**Learning:** Internal testing or migration endpoints are sometimes merged without the required `authenticateToken` and `authorizeRole` middleware, exposing system-level commands.
**Prevention:** Always require strict authentication and authorization ('admin') on any route using `child_process`, or remove them entirely from production builds.
