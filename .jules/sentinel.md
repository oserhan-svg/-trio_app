## 2024-08-20 - Unauthenticated Internal Endpoints & Error Leakage
**Vulnerability:** The `/internal/migrate` endpoint was exposed without authentication, allowing arbitrary users to trigger database migrations. Additionally, the endpoint leaked raw `stderr` output in its error response.
**Learning:** Internal administrative routes were added without the `isAdmin` middleware, and utility functions using `child_process.exec` carelessly returned raw error output, violating the principle of failing securely.
**Prevention:** Always wrap internal or administrative routes with `isAdmin` middleware and sanitize error responses from system commands to prevent exposing internal stack traces or environment details.
