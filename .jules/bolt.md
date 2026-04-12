## 2025-05-15 - [Consolidated Dashboard Counts]
**Learning:** Sequential count queries for dashboard statistics (total properties, by source, by assignment) created unnecessary database round-trips. PostgreSQL's `FILTER` clause in a single `$queryRaw` can aggregate all these counts in one table scan.
**Action:** Use `COUNT(*) FILTER (WHERE ...)` in raw SQL via Prisma to consolidate multiple status or source counts into a single efficient query. Combine this with `Promise.all` in controllers to parallelize other independent metrics.
