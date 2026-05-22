## 2025-01-24 - [N+1 Query Elimination in Performance Dashboard]
**Learning:** Controller methods that loop through consultants or months and perform database counts (Prisma) are a major performance bottleneck, especially as the team grows. Using `groupBy` and `$queryRaw` with `EXTRACT` (for PostgreSQL) allows for O(1) constant-time data retrieval.
**Action:** Always check for `await prisma` inside `.map` or `for` loops in analytics/performance controllers. Use bulk aggregations or time-series SQL queries instead.
