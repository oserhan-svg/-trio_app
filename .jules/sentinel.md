## 2025-05-14 - Admin Password Reset Vulnerability
**Vulnerability:** The `server/scripts/createAdminPrisma.js` script reset the admin password to '1234' on every server restart due to its presence in the `update` block of an `upsert` operation.
**Learning:** Using `upsert` with hardcoded or default sensitive data in the `update` block causes recurring state resets that can overwrite intentional user changes.
**Prevention:** Remove sensitive fields from the `update` block of `upsert` operations unless explicitly intended to be reset.

## 2025-05-14 - Hardcoded API Secret Exposure
**Vulnerability:** A live WebShare API key was hardcoded in `server/PROXY_SETUP.md`.
**Learning:** Documentation files are often overlooked during secret scanning and can contain sensitive examples.
**Prevention:** Use placeholders in documentation and enforce pre-commit secret scanning across all file types.
