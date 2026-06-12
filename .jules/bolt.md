## 2025-02-12 - Optimize Consultant Performance Query

**Learning:** PerformanceController's `getConsultantPerformance` mapped over all consultants to execute 5 separate query counts per consultant, resulting in an O(N) N+1 query issue. Additionally, Prisma doesn't natively support `groupBy` on nested relations like `interaction.client.consultant_id`.

**Action:** Replace looped `prisma.count` queries with `Promise.all` + `prisma.groupBy` queries. For nested relational grouping like interactions via clients, use `findMany` combined with `select` and an in-memory `.reduce` lookup map for O(1) metric assignments.
