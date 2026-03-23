## 2024-03-23 - Unauthenticated Webhook/Sync Endpoint
**Vulnerability:** The `/extension-sync` endpoint in `server/routes/whatsappRoutes.js` lacked authentication middleware, exposing it to potential data spoofing and unverified writes from external sources.
**Learning:** Routes intended to receive incoming data from external clients (like browser extensions or webhooks) must explicitly require authentication (like `authenticateToken` or API key validation) unless explicitly designed for public access.
**Prevention:** Always verify that every route handling data mutation uses appropriate authentication and authorization middleware.
