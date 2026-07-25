## 2026-07-25 - Batch independent Prisma queries to avoid N+1 bottleneck
**Learning:** Sequential `await prisma.property.count()` calls for independent aggregate queries cause an N+1 performance bottleneck. Because the conditions use partial matching (`contains`), they are incompatible with `groupBy` and must be batched with `Promise.all`.
**Action:** Use `Promise.all` to batch independent Prisma aggregate queries when they cannot be optimized with `groupBy`.
