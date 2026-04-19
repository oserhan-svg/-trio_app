## 2024-04-19 - [Bulk Aggregation for Performance]
**Learning:** High N+1 query patterns in performance controllers (5N+1 for summary and 12 for detail) significantly impact API latency as the number of consultants grows.
**Action:** Use `prisma.groupBy` and `prisma.$queryRaw` for bulk data fetching followed by in-memory Map-based lookups to keep query count constant (O(1) database complexity relative to entity count).
