## 2024-05-24 - N+1 bottleneck with partial match count queries
**Learning:** Sequential Prisma `.count()` calls using partial matching operators (like `contains`) cannot be grouped and should be batched with `Promise.all` to avoid N+1 bottlenecks.
**Action:** When calculating statistics that require `contains` filtering on text fields, wrap all independent `.count()` calls in `Promise.all()` to execute them concurrently instead of trying to use `groupBy` or running them sequentially.
