## 2024-05-15 - [HIGH] Fix overly permissive CORS configuration
**Vulnerability:** CORS in Express and Socket.io used a permissive fallback callback(null, true) while credentials: true was enabled.
**Learning:** Permissive fallback in CORS while credentials: true is dangerous and allows unknown domains to make authenticated cross-origin requests.
**Prevention:** Always explicitly deny unknown origins using callback(new Error('Not allowed by CORS')) when using custom dynamic origin validation.