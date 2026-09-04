## 2025-05-18 - Authorization Bypass Fix
**Vulnerability:** Admin stats endpoint was missing role authorization
**Learning:** `isAdmin` middleware wraps `authenticateToken`, so we only need to use `isAdmin` directly. Automated reviews might give false positives about missing `authenticateToken`.
**Prevention:** Always verify how authentication middlewares are composed to avoid duplicate execution.
