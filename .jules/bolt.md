## 2025-05-22 - [Optimizing Metrics with Bulk Aggregation]
**Learning:** N+1 query patterns in dashboard metrics (like consultant performance) significantly degrade performance as the team grows. Standard iterative counts (1+5N) can be replaced with O(1) bulk aggregations using Prisma's `groupBy` and SQL's `TO_CHAR`.
**Action:** When implementing list-based metrics, always use bulk aggregation with an in-memory mapping helper to maintain O(1) database complexity.
