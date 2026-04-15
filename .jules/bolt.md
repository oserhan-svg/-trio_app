## 2026-04-15 - [N+1 Optimization in performanceController]
**Learning:** Found N+1 query pattern in performance dashboard where each consultant triggered 5 separate count queries. Also found 6-month historical stats being fetched with 12 individual queries.
**Action:** Replaced loop-based counts with bulk Prisma `groupBy` and `$queryRaw` for relation-based aggregation. Used range-based fetching for historical data to reduce database round-trips from O(N) to O(1).
