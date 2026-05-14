## 2024-05-24 - Parallelize Independent DB Aggregations
**Learning:** Sequential independent database counts (e.g., via Prisma) inside controller mappings cause N+1 latency bottlenecks.
**Action:** Always group independent Prisma queries using `Promise.all()` to execute them concurrently, especially inside collection iterations like `.map()`.
