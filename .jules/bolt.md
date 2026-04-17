## 2025-05-15 - [Multi-table Aggregation with Prisma]
**Learning:** Prisma's `groupBy` does not support aggregating across relations (e.g., grouping `Interactions` by `Client.consultant_id`). Attempting to do this via loops leads to N+1 query patterns. Using `prisma.$queryRaw` with an explicit `JOIN` and casting `COUNT(*)` as `::int` (for Postgres) is the most efficient solution and prevents JSON serialization errors with BigInt.
**Action:** Use raw SQL for complex cross-table aggregations instead of loop-based counting. Always cast Postgres counts to `::int`.

## 2025-05-15 - [Efficient Historical Data Fetching]
**Learning:** Fetching time-series data (e.g., last 6 months) using a loop of 12+ queries is a significant bottleneck. A single range-based fetch followed by in-memory grouping is much faster, especially in high-latency environments.
**Action:** Replace date-loop queries with single range queries and use `Array.prototype.filter` for in-memory grouping.
