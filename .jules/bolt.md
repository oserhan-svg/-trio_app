## 2025-05-15 - [SQL-Level Filtering and Aggregation]
**Learning:** Moving `searchTerm` filtering and `unreadCount` aggregation from application-level JavaScript to SQL CTEs/JOINs significantly reduces data transfer and latency. It also fixes a bug where filtering on the client side only applied to the first 100 results returned by the database, rather than searching the entire history.
**Action:** Always prefer `ILIKE` and `JOIN/CTE` in raw SQL for large list operations instead of `.filter()` and correlated subqueries.
