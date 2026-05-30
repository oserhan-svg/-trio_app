## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The CORS configuration in `server/index.js` was using a permissive fallback (`callback(null, true)`) for unknown origins while also having `credentials: true` enabled. This effectively allows any origin to make authenticated requests to the server.
**Learning:** The permissive fallback was likely added for easier local development or testing without explicitly allowing new origins.
**Prevention:** Always explicitly deny unknown origins in CORS configurations, especially when credentials are allowed. Use `callback(new Error('Not allowed by CORS'))` instead of silently allowing them.
