## 2025-03-22 - [Thundering Herd in Analytics & AI Context]
**Learning:** Found that the `CacheService` did not implement promise coalescing, causing "thundering herd" issues where multiple concurrent requests for the same missing key would trigger multiple expensive database/API calls. This was particularly visible in `AnalyticsService` and `GroqService`.
**Action:** Implemented Promise Coalescing in `CacheService.getOrSet` by tracking in-flight promises. Refactored `AnalyticsService` to use this centralized pattern, ensuring only one expensive operation runs per key at any given time.
