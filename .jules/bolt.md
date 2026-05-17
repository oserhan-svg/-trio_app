## 2025-05-15 - [Database Locale Sensitivity in Aggregations]
**Learning:** Using PostgreSQL `TO_CHAR(..., 'Month')` for grouping is dangerous because it returns space-padded month names (e.g., "May       ") and is dependent on the database's `LC_TIME` setting, which may not match the application's locale.
**Action:** Use `EXTRACT(MONTH FROM ...)` and `EXTRACT(YEAR FROM ...)` to get numeric values, which are locale-independent and easier to map in JavaScript.

## 2025-05-15 - [Bulk Aggregations vs N+1 in Prisma]
**Learning:** Prisma's `groupBy` is powerful for single-model aggregations, but for multi-model aggregations (e.g., joining `interactions` and `clients`), `$queryRaw` is necessary to maintain O(1) query complexity.
**Action:** Prioritize `$queryRaw` with `Prisma.join()` for complex joins in performance-critical paths to keep database round-trips constant.
