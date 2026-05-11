## 2026-05-11 - [N+1 Query Elimination in Performance Dashboard]
**Learning:** Dashboard endpoints calculating multi-model metrics (properties, interactions, tasks) for multiple users are highly susceptible to N+1 query bottlenecks when using simple loops or Promise.all over user lists.
**Action:** Use Prisma `groupBy` for simple aggregations and `$queryRaw` for complex joins across users/months to reduce database complexity from O(N) to O(1).
