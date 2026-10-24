## 2025-05-24 - Unauthenticated Internal Migration Endpoint
**Vulnerability:** An unauthenticated `/internal/migrate` endpoint executed `prisma migrate dev` via `child_process.exec`.
**Learning:** Development tools and commands left in production routes create severe RCE and data loss vectors. `prisma migrate dev` drops tables if it detects drift, which can destroy production data if exposed unauthenticated.
**Prevention:** Never map development scripts to HTTP endpoints. If absolutely required for internal ops, strictly enforce admin authorization and do not rely on obscured paths (`/internal/...`).
