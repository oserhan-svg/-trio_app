## 2025-05-15 - Analytics Module Optimization
**Learning:** Sequential await calls in controllers for independent database queries create unnecessary latency. Also, expensive aggregation services are vulnerable to cache stampedes when multiple concurrent requests occur during cache expiration.
**Action:** Use `Promise.all` for independent queries in controllers. Implement promise coalescing (storing the in-flight promise) in services to collapse concurrent identical requests into a single operation.
