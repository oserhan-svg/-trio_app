## 2025-05-15 - Bulk Aggregation for N+1 Queries
**Learning:** Replacing iterative `count()` or `findMany()` calls inside loops with bulk `$queryRaw` or `groupBy` reduces query count from O(N) to O(1). When mapping bulk results back to a list, ensure all possible ID keys (e.g., `assigned_user_id`, `consultant_id`, `user_id`) are handled in the mapping helper.
**Action:** Always use bulk aggregations for dashboard metrics and carefully verify the ID mapping logic when results come from different tables with different foreign key names.

## 2025-05-15 - Prisma $queryRaw and Array Expansion
**Learning:** Prisma's `$queryRaw` tagged templates correctly handle array expansion for `IN` clauses (e.g., `WHERE id IN (${ids})`). Manually joining arrays into strings or using template literals outside the tagged template causes SQL syntax errors and injection risks.
**Action:** Use standard Prisma tagged templates `${}` for array parameters in `$queryRaw`.
