## 2025-05-23 - [N+1 SQL Subquery Optimization]
**Learning:** Correlated subqueries for counts (e.g., unread messages per chat) create an N+1 performance bottleneck at the database level. While Prisma protects against many issues, raw SQL queries require manual optimization to batch these aggregations.
**Action:** Use Common Table Expressions (CTEs) to perform grouped aggregations once and then JOIN the result to the main dataset. This reduces the number of operations from O(N) subqueries to a single JOIN.
