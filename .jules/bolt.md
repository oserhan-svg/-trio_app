## 2025-02-18 - Concurrent Queries in Maps
**Learning:** When calculating metrics or aggregating independent statistics inside loops like map(), sequentially awaiting Prisma queries (e.g., saleCount, rentCount) causes significant latency due to N+1 characteristics.
**Action:** Always wrap independent async database calls inside inner Promise.all() arrays for maximum concurrency.
