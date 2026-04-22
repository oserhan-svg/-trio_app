
## 2026-04-22 - [N+1 Query Optimization in performanceController]
**Learning:** The performanceController was suffering from severe N+1 query patterns. getConsultantPerformance was doing 1+5N queries, and getConsultantDetail was doing 14 queries. By using Prisma's groupBy and $queryRaw for bulk aggregations, these were reduced to 5 and 4 queries respectively.
**Action:** Always look for loops containing database queries and replace them with bulk aggregations (groupBy or JOINs) to maintain O(1) query complexity relative to the number of items.
