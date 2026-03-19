## 2025-05-15 - [Promise Coalescing in CacheService]
**Learning:** In-memory caches without promise coalescing are vulnerable to the "thundering herd" problem, especially for expensive database aggregations like `getNeighborhoodStatsMap`. Multiple concurrent requests can bypass the cache check before the first request populates it.
**Action:** Always implement promise coalescing in `getOrSet` patterns for heavy operations. Unify local service caches into a centralized `CacheService` to ensure consistent TTL and memory governance.
>>>>>>> REPLACE
