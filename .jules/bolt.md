## 2025-03-01 - Fix N+1 Query in Performance Dashboard
**Learning:** Prisma's `groupBy` cannot directly group by fields on related models (e.g., `client.consultant_id`). This previously forced the use of sequential N+1 query loops to fetch counts for nested relations like interactions.
**Action:** When resolving N+1 queries that require counts grouped by a nested relation, utilize a batched `findMany` request to fetch the identifiers and resolve/map the groupings dynamically in memory.
