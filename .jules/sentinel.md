## 2025-05-15 - [API Key Authentication for Extension Endpoints]
**Vulnerability:** Unauthenticated or inconsistently authenticated API endpoints used by the Chrome extension.
**Learning:** Endpoints meant for external components (like browser extensions) often lack the same level of security as user-facing routes, especially when they don't fit the standard JWT flow.
**Prevention:** Always implement centralized, secure authentication (like API keys with constant-time comparison) for all externally reachable endpoints, and ensure they are covered by unit tests.
