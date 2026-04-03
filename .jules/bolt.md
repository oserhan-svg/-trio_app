## 2026-04-03 - [Parallelize and Consolidate Analytics Queries]
**Learning:** Sequential `await` calls on independent Prisma `count()` operations create unnecessary database round-trips and block the event loop linearly. Using PostgreSQL's `COUNT(*) FILTER (WHERE ...)` in a single `prisma.$queryRaw` call can consolidate multiple conditional counts into a single table scan.
**Action:** Always look for opportunities to use `Promise.all` for independent service calls and consolidate multiple simple counts or aggregations into a single raw SQL query with `FILTER` when using PostgreSQL.
