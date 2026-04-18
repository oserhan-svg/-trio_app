## 2025-05-14 - [Bulk Aggregations in Performance Controller]
**Learning:** Prisma's `groupBy` does not support aggregating across relations (e.g., grouping Interactions by Client.consultant_id). For such cases, `prisma.$queryRaw` with a `JOIN` is significantly more efficient than N+1 queries. Casting `COUNT(*)` as `::int` in PostgreSQL avoids JSON serialization issues with `BigInt`.
**Action:** Use `$queryRaw` with `Prisma.join` for relational aggregations and range-based in-memory grouping for time-series data to minimize database round-trips.
