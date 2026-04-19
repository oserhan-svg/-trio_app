## 2025-05-14 - Admin Password Reset Vulnerability
**Vulnerability:** The `createAdminPrisma.js` script, which runs on every server startup, was overwriting the admin user's `password_hash` using an `upsert` operation. This reset any manually changed admin passwords back to the hardcoded default '1234'.
**Learning:** Using `upsert` with sensitive fields like `password_hash` in the `update` block can lead to accidental credential resets during routine operations if the script is part of the startup process.
**Prevention:** Only include fields that should be updated (like roles or metadata) in the `update` block of an `upsert`. Sensitive fields like passwords should only be set in the `create` block or through a dedicated password change process.
