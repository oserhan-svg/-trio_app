## 2025-05-15 - [Analytics Optimization]
**Learning:** Consolidating multiple `prisma.count()` calls into a single `prisma.$queryRaw` with `COUNT(CASE WHEN...)` significantly reduces database round-trips and table scans for dashboard-style analytics. Parallelizing service calls with `Promise.all` further minimizes the critical path for response time.
**Action:** Always look for opportunities to batch independent count or aggregate queries into a single raw SQL execution for performance-critical endpoints.
