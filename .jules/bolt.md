## 2025-05-15 - [Parallelism & Promise Coalescing]
**Learning:** Sequential await calls in the analytics dashboard were causing cumulative latency. Also, concurrent requests to the Groq/Analytics services could trigger redundant expensive fetches.
**Action:** Use Promise.all for independent DB queries in controllers. Implement a 'promises' Map in CacheService.getOrSet to coalesce multiple concurrent requests for the same key into a single fetch (Thundering Herd protection).
