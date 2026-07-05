## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** Express and Socket.io CORS configurations allowed all origins dynamically via `callback(null, true)` while `credentials: true` was enabled.
**Learning:** Returning `callback(null, true)` for unknown origins defeats CORS protections entirely, allowing any site to make authenticated requests.
**Prevention:** Always explicitly deny unknown origins with `callback(new Error('Not allowed by CORS'))` when `credentials: true` is set.