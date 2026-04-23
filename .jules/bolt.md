## 2024-04-23 - Concurrent Prisma Counting
**Learning:** Grouping independent Prisma count queries inside loops with `Promise.all()` significantly reduces query latency compared to sequential awaiting.
**Action:** Always use `Promise.all()` for independent statistics and count queries. Wrap inner grouped queries inside `Promise.all` within map collections.
