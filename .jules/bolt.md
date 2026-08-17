## 2024-08-17 - N+1 query problem in performanceController
**Learning:** Found N+1 query pattern in `getConsultantPerformance` and `getConsultantDetail` where DB queries (`count`, etc.) are made inside a loop over consultants/months. Since Prisma supports grouped aggregations, this can be heavily optimized using `groupBy` and in-memory grouping instead of issuing individual queries for each consultant.
**Action:** Avoid querying inside loops. Use batch queries/group-bys where possible and map the results in memory.
