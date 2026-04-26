## 2025-05-15 - [Critical] Exposed Internal Migration Endpoint
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was completely unprotected, allowing anyone to trigger database migrations which execute shell commands.
**Learning:** Internal utility routes can easily be overlooked during security audits if they aren't part of the primary user flow.
**Prevention:** Always apply `authenticateToken` and appropriate role checks to any route that performs administrative or system-level operations.

## 2025-05-15 - [Medium] Plain-text Password Leakage in Logs
**Vulnerability:** The `updateUser` controller was logging the entire request body, including the `password` field, to the server console.
**Learning:** `console.log(req.body)` is a dangerous anti-pattern in controllers handling sensitive data.
**Prevention:** Explicitly pick allowed fields for logging or use a sanitizing logger that masks sensitive keys like 'password', 'token', or 'secret'.

## 2025-05-15 - [Medium] Persistent Admin Password Reset
**Vulnerability:** The database initialization script was resetting the admin password to a hardcoded '1234' on every server startup using Prisma `upsert`.
**Learning:** Prisma `upsert`'s `update` block will execute every time if the record exists, which can overwrite manual changes to sensitive fields.
**Prevention:** Exclude sensitive fields like `password_hash` from the `update` block of an `upsert` if they should only be set once during creation.
