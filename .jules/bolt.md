## 2025-05-15 - Parallelize Dashboard Analytics
**Learning:** Sequential database counts in a single request handler created a cumulative bottleneck. Even with fast individual queries, the total wait time was linear (N queries * avg latency).
**Action:** Use `Promise.all` to parallelize independent Prisma counts and service calls. This reduced dashboard calculation time significantly by overlapping I/O wait states.

## 2025-05-15 - Thundering Herd Protection in CacheService
**Learning:** Centralized caching without promise coalescing (waiting for an in-flight request for the same key) leads to "thundering herd" problems where multiple concurrent requests bypass the cache and hit the database simultaneously.
**Action:** Implement a `promises` Map in `CacheService.getOrSet` to coalesce concurrent requests for the same key into a single execution.
