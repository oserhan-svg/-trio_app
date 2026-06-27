## 2025-02-26 - Optimize Concurrent Database Counting with groupBy
**Learning:** In highly trafficked API endpoints, executing multiple `.count` database queries concurrently via `Promise.all` can quickly exhaust database connection pools or add unnecessary overhead when counting data that can be grouped.
**Action:** When calculating aggregated counts of different subsets from the same table (e.g., active buyers vs active sellers), consolidate multiple `prisma.count` queries into a single `prisma.groupBy` query where possible.
