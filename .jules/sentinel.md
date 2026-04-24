## 2024-05-18 - Unprotected Migration Route
**Vulnerability:** Internal test route executing child_process.exec was completely unprotected.
**Learning:** Internal routes intended for debugging or migrations are sometimes left unauthenticated, leading to RCE vulnerabilities.
**Prevention:** Always wrap internal admin/system operations with authenticateToken and authorizeRole('admin') or remove them entirely from production.
