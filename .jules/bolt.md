## 2025-05-14 - Optimized Consultant Performance Aggregation
**Learning:** The `performanceController.js` had N+1 query patterns where database calls were made inside loops for each consultant and each month. Prisma's `groupBy` and `$queryRaw` can be used to aggregate these counts in bulk, reducing database round-trips from $O(N)$ to $O(1)$.
**Action:** Always check for `await prisma` calls inside `.map` or `for` loops. Use bulk aggregation and in-memory mapping to handle multi-model statistics efficiently.
