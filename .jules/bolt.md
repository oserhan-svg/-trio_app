## 2025-05-15 - [N+1 Query Elimination in Performance Dashboard]
**Learning:** The performance dashboard was suffering from O(N) database complexity by querying stats for each consultant and month individually. PostgreSQL's bulk aggregations and raw SQL grouping are significantly more efficient.
**Action:** Always prefer `prisma.model.groupBy` or `$queryRaw` with `GROUP BY` for dashboard statistics to maintain O(1) database complexity regardless of list size.
