## 2024-10-26 - Explicitly Deny Unknown CORS Origins
**Vulnerability:** Permissive fallback in CORS configuration dynamically allowed any origin while `credentials: true` was enabled.
**Learning:** The fallback was intended to "allow softly" for debugging, but doing so with credentials enabled completely bypassed CORS protections, allowing CSRF and cross-origin credential theft.
**Prevention:** Always explicitly return `callback(new Error('Not allowed by CORS'))` for unknown origins when `credentials: true` is set.
