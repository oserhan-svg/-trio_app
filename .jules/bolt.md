## 2024-05-15 - Resolving N+1 queries with Prisma groupBy and findMany
**Learning:** Prisma's `groupBy` cannot directly group by fields on related models (e.g., `client.consultant_id`). Attempting to do so fails.
**Action:** When resolving N+1 queries that require counts grouped by a nested relation, utilize a batched `findMany` request to fetch the identifiers and resolve/map the groupings dynamically in memory.
