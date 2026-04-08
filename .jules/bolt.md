# Bolt's Journal - Critical Learnings

## 2025-05-15 - Optimized Dashboard Analytics
**Learning:** Consolidating multiple conditional counts into a single SQL query using PostgreSQL `FILTER (WHERE ...)` clauses is significantly more efficient than running multiple sequential `prisma.count()` calls. Additionally, casting `COUNT(*)` as `::int` in raw SQL is crucial to avoid `BigInt` serialization errors in Express responses.

**Action:** Use consolidated raw SQL for complex dashboard statistics and always cast counts to `::int` when using PostgreSQL raw queries with Prisma.

## 2025-05-15 - Thundering Herd Prevention
**Learning:** High-traffic endpoints that use caching are vulnerable to "thundering herd" issues where multiple simultaneous requests trigger redundant expensive database fetches if the cache is cold.

**Action:** Implement Promise Coalescing in `CacheService` by tracking in-flight promises in a `pending` Map, ensuring only one fetcher is executed for concurrent requests of the same key.
