## 2025-05-22 - Optimization of N+1 Queries in Performance Controllers
**Learning:** Found critical N+1 query patterns in dashboard controllers (`getConsultantPerformance` and `getConsultantDetail`). For N consultants, the list endpoint performed 1+5N queries. The detail endpoint performed 12+ queries for a 6-month view.
**Action:** Use bulk aggregations with Prisma's `groupBy` and `$queryRaw` to reduce database round-trips. Always check for loops containing database calls in aggregation logic.
