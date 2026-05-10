## 2025-05-15 - Unprotected RCE-capable internal endpoint
**Vulnerability:** The `/api/deals/internal/migrate` endpoint was exposed via a simple `GET` request and had no authentication or authorization. It executes shell commands (`prisma migrate`).
**Learning:** Internal-only or administrative utility endpoints can be easily overlooked if they aren't part of the main user flow, yet they present the highest risk if they allow arbitrary command execution.
**Prevention:** Always secure administrative endpoints with both role-based access control (RBAC) and defense-in-depth measures like secondary header keys. Use `POST` for any operation that changes system state or executes shell commands to prevent accidental or CSRF-based execution.
