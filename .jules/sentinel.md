## 2024-05-24 - Unauthenticated Internal Migration Endpoint

**Vulnerability:** An internal migration endpoint (`/api/deals/internal/migrate`) was exposed without any authentication or authorization checks. Furthermore, the endpoint leaked internal command execution errors (like stderr and error messages) directly to the client.
**Learning:** Internal maintenance routes, especially those that execute shell commands or database migrations, can be easily forgotten and left exposed.
**Prevention:** Always secure internal maintenance endpoints with strict role-based access control (e.g., `isAdmin`). Never return raw shell output or unhandled error messages to the client; log them server-side and return generic error messages.