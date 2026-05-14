## 2024-05-24 - Unauthenticated Migration Endpoint
**Vulnerability:** An unauthenticated endpoint `/internal/migrate` could execute shell commands (`child_process.exec`).
**Learning:** Internal or testing routes that execute commands must never be left unprotected in Express applications as they pose severe RCE and abuse risks.
**Prevention:** Always protect administrative or internal endpoints with strict authentication (`authenticateToken`) and authorization (`authorizeRole('admin')`) middleware, or completely remove them from production code.
