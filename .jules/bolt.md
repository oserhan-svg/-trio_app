## 2025-05-14 - [Thundering Herd Protection in CacheService]
**Learning:** The centralized `CacheService.getOrSet` lacked promise coalescing, leading to multiple redundant fetcher executions (e.g., database queries) during concurrent cache misses for the same key.
**Action:** Implement a `pendingPromises` Map in `CacheService` to track in-flight requests and return the same promise to all concurrent callers, ensuring the fetcher is only called once. Always use a `finally` block to clear the pending promise to prevent permanent blocks on error.
