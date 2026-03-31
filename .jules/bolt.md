## 2025-05-22 - [Optimizing Analytics Counts with PostgreSQL Filter]
**Learning:** Consolidating multiple sequential database counts into a single raw SQL query using `COUNT(*) FILTER (WHERE ...)` significantly reduces network round-trips and database execution overhead, especially when parallelized with `Promise.all`.
**Action:** Always check if multiple Prisma `count()` or `findUnique()` calls on the same table can be consolidated into a single raw SQL or parallelized to improve backend performance.
