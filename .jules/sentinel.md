## 2024-03-20 - Unauthenticated Command Injection via Database Migration Endpoint
**Vulnerability:** A `GET /internal/migrate` endpoint executed `prisma migrate dev` via `child_process.exec()` without any authentication or authorization checks.
**Learning:** Development-specific endpoints or CLI commands (like database migrations) are sometimes mistakenly exposed as web endpoints for convenience during early development, leading to severe command execution and database manipulation risks.
**Prevention:** Never expose database schema modification commands or any shell execution (`exec()`) directly as web endpoints. Migrations should strictly be part of a separate CI/CD pipeline or safe CLI scripting, isolated from the runtime web server environment.
