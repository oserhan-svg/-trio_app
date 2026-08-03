## 2026-08-02 - Optimize Independent Prisma Queries
**Learning:** When making multiple independent `await prisma.*.count()` (or similar aggregate) calls sequentially, it introduces an N+1 bottleneck. While `groupBy` is preferred for overlapping conditions, conditions using partial matching operators (like `contains`) are incompatible with `groupBy`.
**Action:** Always batch these independent Prisma queries using `Promise.all` to run them concurrently when `groupBy` cannot be used.
