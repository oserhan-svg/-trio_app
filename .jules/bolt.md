## 2025-05-14 - Thundering Herd in CacheService
**Learning:** The centralized `CacheService` lacked promise coalescing, leading to multiple concurrent backend/database calls for the same missing cache key (thundering herd issue) under high load.
**Action:** Implemented a `pending` promises Map in `CacheService.getOrSet` to collapse concurrent identical requests into a single in-flight operation.
