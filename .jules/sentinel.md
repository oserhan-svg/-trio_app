## 2024-05-24 - Overly Permissive CORS Configuration
**Vulnerability:** The application was allowing requests and WebSocket connections from any origin dynamically by explicitly returning `callback(null, true)` in CORS configurations, while also setting `credentials: true`. This exposes the application to Cross-Site Request Forgery (CSRF) and enables unauthorized access to authenticated endpoints by third-party sites.
**Learning:** Returning `callback(null, true)` for unmatched origins when `credentials: true` essentially bypasses the browser's CORS policy, making wildcard authentication possible.
**Prevention:** Always explicitly deny unknown origins by returning `callback(new Error('Not allowed by CORS'))` and never use permissive fallbacks with authenticated endpoints.
