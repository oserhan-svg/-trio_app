## 2025-05-14 - Promise Coalescing for Expensive Queries
**Learning:** In high-concurrency environments, expensive database queries (like neighborhood-wide aggregations) can cause "cache stampedes" where multiple requests trigger the same query before the first one finishes and caches. Promise coalescing (storing the in-flight promise) ensures only one query hits the DB while all concurrent callers wait for the same result.
**Action:** Always consider promise coalescing for expensive, cacheable async operations in the service layer.
