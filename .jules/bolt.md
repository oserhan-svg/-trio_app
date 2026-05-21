## 2025-05-14 - [Performance Dashboard Optimization]
**Learning:** N+1 query patterns in dashboard controllers significantly degrade performance as the number of consultants or months increases. Prisma's `groupBy` and `$queryRaw` with `EXTRACT` are highly effective for bulk aggregation. Using `Prisma.join()` is necessary for safe array parameterization in raw SQL `IN` clauses.
**Action:** Always prefer bulk aggregations over loops for dashboard statistics. Use `$queryRaw` when complex joins or date extractions (like monthly grouping) are required to keep database round-trips constant (O(1)).
