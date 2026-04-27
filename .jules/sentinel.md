## 2024-05-20 - Unauthenticated Internal Migration Endpoint
**Vulnerability:** Found an unauthenticated endpoint (`/internal/migrate`) executing shell commands (`child_process.exec('prisma migrate dev...')`) without authorization.
**Learning:** Internal toolings and scripts were added for convenience during development but were left exposed in the routing structure without middleware protection, creating a command injection/RCE risk.
**Prevention:** All internal endpoints, especially those interacting with the system shell or executing administrative tasks, must be strictly protected with both `authenticateToken` and `authorizeRole('admin')` middleware, or completely removed from production deployments.
