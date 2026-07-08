## 2024-07-07 - Refactoring N+1 Prisma Queries using Promise.all
**Learning:** Sequential `.count()` queries in iterators caused high latency due to consecutive round-trips. Grouping multiple independent queries is highly effective but `.groupBy()` on relations is not supported in this ORM version.
**Action:** Always batch independent Prisma aggregate queries using `Promise.all` inside the mapping closure when `groupBy` is unavailable or when multiple distinct queries are required for each item.
