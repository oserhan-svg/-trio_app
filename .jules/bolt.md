## 2024-07-23 - Concurrent database queries
**Learning:** Sequential await prisma.*.count() queries are causing N+1 bottlenecks.
**Action:** Use Promise.all to run independent Prisma queries concurrently.
