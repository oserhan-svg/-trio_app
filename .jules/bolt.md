## 2024-05-18 - Fix N+1 queries using Prisma GroupBy
**Learning:** Prisma does not support `.groupBy` directly over relation fields. This creates a trap where developers fall back to N+1 sequential loops.
**Action:** When calculating grouped stats involving relations, use `findMany` to fetch records and aggregate the relation counts locally in memory, while using `groupBy` for direct table fields.