
## 2025-05-10 - Elimination of N+1 Queries in Performance Dashboard
**Learning:** Found O(N) database query patterns in dashboard controllers where each consultant or month triggered multiple separate count queries. Collapsing these into bulk aggregations using Prisma's `groupBy` and `$queryRaw` with JOINs reduces database round-trips to O(1).
**Action:** When implementing dashboards or statistics, prioritize bulk aggregations over iterative queries. Use `$queryRaw` when Prisma's `groupBy` lacks JOIN support for cross-model counts.
