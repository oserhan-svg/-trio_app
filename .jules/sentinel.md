## 2024-05-24 - Unauthenticated Command Injection in Migration Route
**Vulnerability:** The internal testing endpoint `/api/deals/internal/migrate` was completely unauthenticated and executed a raw OS command (`child_process.exec`) directly, allowing anyone with access to the API to execute arbitrary code.
**Learning:** Development or testing endpoints left over in the application code without explicit authentication and authorization can easily become critical attack vectors.
**Prevention:** Always secure all administrative or testing endpoints with strict authorization, such as both `authenticateToken` and `authorizeRole('admin')`. Or better yet, fully remove them from the production codebase.
