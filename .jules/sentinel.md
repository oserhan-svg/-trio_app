# Sentinel's Journal - Critical Security Learnings

## 2025-05-15 - [Exposed Secrets and Unauthenticated Extension Endpoints]
**Vulnerability:** A hardcoded `WEBSHARE_API_KEY` was found in `server/PROXY_SETUP.md`, and critical endpoints for scraper data import and WhatsApp sync were entirely unauthenticated.
**Learning:** External components like Chrome extensions are often overlooked in the overall authentication architecture, leading to "shadow" APIs that are publicly accessible.
**Prevention:** All API endpoints must have an explicit authentication middleware. For non-user components, use API key validation with `crypto.timingSafeEqual` and SHA-256 hashing to mitigate timing attacks and length-based leaks.

## 2025-05-15 - [Secure API Key Comparison Pattern]
**Vulnerability:** Simple string comparison (`==`) for API keys is vulnerable to timing attacks.
**Learning:** Even if keys have different lengths, comparing them directly can leak information about the correct key.
**Prevention:** Use SHA-256 to hash both the client-provided key and the server-side secret to a fixed length before using `crypto.timingSafeEqual`. This ensures constant-time comparison regardless of the input length or content.
