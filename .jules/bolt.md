## 2024-06-16 - Prevent N+1 relation counts
**Learning:** Prisma does not support `.groupBy` directly over relation fields (e.g., counting interactions grouped by `client.consultant_id`). Executing multiple concurrent `.count` queries inside a loop creates an N+1 bottleneck.
**Action:** Batch queries using `.groupBy` on foreign keys of the target table (e.g., grouping the base table by `assigned_user_id`), or use `findMany` to fetch records and aggregate the relation counts locally.
