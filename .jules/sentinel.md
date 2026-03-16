## 2025-05-14 - timing-safe extension authentication
**Vulnerability:** Unauthenticated API endpoints exposed to local network and malicious websites.
**Learning:** Chrome extension background scripts communicating with a local server need an authentication layer, even if they run on the same machine, to prevent unauthorized data injection. Timing-safe comparisons are crucial for secret validation.
**Prevention:** Use custom API key headers for extension-to-server communication and validate them using `crypto.timingSafeEqual`.
