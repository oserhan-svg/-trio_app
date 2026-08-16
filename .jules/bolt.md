## YYYY-MM-DD - [Optimize Prisma count grouping]
**Learning:** Using multiple independent `.count()` calls in Prisma blocks execution sequentially unless wrapped in `Promise.all()`. Also Prisma supports `.groupBy()` for complex groupings, but when evaluating queries with operators that `groupBy` doesn't support, independent batched queries are required.
**Action:** Always wrap independent `.count()` queries in `Promise.all()` to execute concurrently.
