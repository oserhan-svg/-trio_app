## 2025-05-14 - Remote Code Execution via Unprotected Migration Route
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was completely public and executed shell commands using `child_process.exec` without any authentication or input validation.
**Learning:** Internal utility routes or "one-off" migration scripts can easily be overlooked during security audits, especially if they are added quickly to solve deployment issues.
**Prevention:** Always apply the most restrictive middleware by default to all new routes. Any endpoint that executes shell commands must have multiple layers of protection (e.g., admin check + internal secret key).

## 2025-05-14 - Hardcoded Credentials and Automatic Password Resets
**Vulnerability:** `server/scripts/createAdminPrisma.js` contained a hardcoded password ('1234') and reset the admin's password on every application restart via an `upsert` update block.
**Learning:** Using `upsert` without carefully selecting which fields to update can lead to unintended side effects like overwriting sensitive user data (passwords) during routine database synchronization tasks.
**Prevention:** Use environment variables for all default credentials and ensure `upsert` operations only update non-sensitive metadata while excluding security-critical fields like `password_hash`.
