## 2025-05-15 - [N+1 Query Elimination in Performance Dashboard]
**Learning:** The performance dashboard was suffering from a classic N+1 query pattern where monthly stats were being fetched in a loop for every consultant. This led to ~5N queries for N consultants. Additionally, monthly time-series data was being fetched in a loop of 6 months.

**Action:** Use Prisma `groupBy` for bulk aggregations on single tables and `$queryRaw` with `JOIN` and `TO_CHAR` (PostgreSQL) for complex cross-table aggregations and date-based grouping. This reduces query complexity from O(N) to O(1).
