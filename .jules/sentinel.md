## 2024-05-02 - Protect internal migration endpoint
**Vulnerability:** Unauthenticated access to /internal/migrate which runs shell commands (exec).
**Learning:** Internal testing routes running system commands via exec must be strictly protected with both authentication and admin authorization to prevent unauthorized access and potential RCE/Command Injection.
**Prevention:** Always secure internal endpoints that interact with the system or shell with authenticateToken and authorizeRole('admin').
