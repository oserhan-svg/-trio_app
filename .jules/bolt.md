## 2024-05-24 - Batching Partial Match Queries
**Learning:** Sequential `prisma.count` queries with partial match conditions (`contains`) in dashboard controllers cause unnecessary database roundtrips. These cannot be optimized with `groupBy` because `contains` isn't supported in `groupBy` statements.
**Action:** Always batch these types of count queries concurrently using `Promise.all` to significantly reduce request latency while maintaining accurate partial matching.
