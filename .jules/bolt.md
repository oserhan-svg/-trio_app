## 2024-05-15 - N+1 Query Elimination in Performance Analytics
**Learning:** The consultant performance dashboard was performing O(N) database queries in a loop, leading to significant latency. Using Prisma's `groupBy` and bulk `$queryRaw` with JOINs allowed reducing this to O(1) total queries.
**Action:** Always prefer bulk aggregations or raw JOINs for analytics dashboards instead of iterative counts in controller loops.

## 2024-05-15 - Prisma $queryRaw Array Interpolation
**Learning:** Prisma's $queryRaw tagged templates automatically handle array expansion for `IN` clauses (e.g., `WHERE id IN (${ids})`). Manually joining arrays or using string interpolation outside the tagged template is unnecessary and introduces SQL injection risks.
**Action:** Use standard tagged template interpolation for arrays in Prisma $queryRaw for cleaner and safer code.
