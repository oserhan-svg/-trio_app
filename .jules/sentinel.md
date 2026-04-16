## 2026-04-16 - Persistent Admin Credentials
**Vulnerability:** The admin initialization script (`server/scripts/createAdminPrisma.js`) used an `upsert` operation that overwrote the `password_hash` with a hardcoded default ('1234') on every server restart.
**Learning:** Idempotent database initialization scripts must be carefully designed to distinguish between initial setup and subsequent runs to avoid reverting manual security changes (like password updates) to insecure defaults.
**Prevention:** In Prisma `upsert` operations, sensitive fields like `password_hash` should only be included in the `create` block, and excluded from the `update` block, unless a specific password reset is intended.
