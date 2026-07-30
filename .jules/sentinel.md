## 2024-07-29 - Unauthenticated Internal Migration Endpoint
**Vulnerability:** The `/internal/migrate` endpoint in `server/routes/dealRoutes.js` executes a shell command (`exec`) without any authentication or authorization middleware, and leaks `stderr` and `stdout` directly to the client response.
**Learning:** Internal tool routes created for debugging or manual administration sometimes bypass standard security middleware and error handling, making them high-risk if accidentally left exposed in production.
**Prevention:** Always secure internal endpoints with `isAdmin` middleware, even for debugging, and avoid returning raw shell output or error stacks in the HTTP response.
