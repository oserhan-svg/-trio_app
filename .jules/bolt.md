## 2025-05-14 - Prisma Relation Aggregation Pattern
**Learning:** Prisma's `groupBy` does not support grouping by fields on related models (e.g., grouping `Interaction` by `client.consultant_id`). Iterating in JS causes N+1 query patterns.
**Action:** Use `prisma.$queryRaw` with an explicit `JOIN` and `::int` casting for counts to perform the aggregation in a single DB round-trip while maintaining JSON-friendly output.
