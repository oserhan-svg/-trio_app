## 2024-10-27 - Parallelize independent DB queries
**Learning:** Performing multiple independent database aggregations (like Prisma counts) sequentially inside a map loop causes N+1 query latency bottlenecks.
**Action:** Always wrap independent async database calls inside Promise.all() to execute them concurrently, especially when mapping over collections.
