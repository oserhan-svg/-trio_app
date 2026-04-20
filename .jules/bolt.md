## 2024-05-20 - Concurrent Independent Database Queries
**Learning:** When calculating statistics that involve multiple independent database queries within an async loop, running them sequentially causes unnecessary latency delays. Wrapping independent queries with `Promise.all` allows them to be executed concurrently.
**Action:** Always wrap independent async operations and independent statistics queries inside `Promise.all`, especially inside loops over collections.
