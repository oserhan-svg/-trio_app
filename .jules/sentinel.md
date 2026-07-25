## 2024-05-24 - Unauthenticated Internal Migration Endpoint
**Vulnerability:** Missing authentication on a route executing shell commands (`exec`).
**Learning:** Internal maintenance/migration routes are easily overlooked when applying global middleware, leading to unauthorized command execution.
**Prevention:** Always explicitly wrap utility/internal endpoints with `isAdmin` middleware and avoid exposing `stderr` or raw command output in API responses.
