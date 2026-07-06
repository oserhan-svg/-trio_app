## 2024-07-06 - Batched Aggregate Counts with Contains Filters
**Learning:** Sequential `prisma.property.count()` calls using partial matching operators (like `contains`) introduce severe N+1 bottlenecks on dashboard endpoints, and these cannot be optimized using `.groupBy` as Prisma's `groupBy` does not support `contains`.
**Action:** Always batch independent count queries containing `contains` or other incompatible operators using `Promise.all` to run them concurrently instead of sequentially.
