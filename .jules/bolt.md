## 2026-04-04 - [SQL Consolidation with PostgreSQL FILTER]
**Learning:** Consolidating multiple count queries into a single raw SQL query using PostgreSQL's 'FILTER' clause significantly reduces database round-trip latency. In Prisma, this is more efficient than firing multiple concurrent 'prisma.model.count()' calls even within 'Promise.all'.
**Action:** Prefer raw SQL with 'FILTER' for batch statistics/dashboard counts on PostgreSQL backends.
