## 2025-01-24 - Promise Coalescing in Centralized Cache
**Learning:** High-concurrency environments are vulnerable to the "thundering herd" problem where multiple requests for the same expired or uncached key trigger redundant expensive operations (like complex DB aggregations). Manual caching with local objects (as seen in `AnalyticsService`) often misses this edge case.
**Action:** Always implement promise coalescing using a `pending` Map in core caching utilities. Ensure that all services utilize this centralized cache instead of maintaining local, potentially inefficient caching logic.
