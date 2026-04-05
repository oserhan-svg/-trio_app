## 2025-05-14 - Dashboard Query Consolidation
**Learning:** Sequential `prisma.count()` calls for different filters cause multiple database round-trips and table scans. Using a single `prisma.$queryRaw` with PostgreSQL `FILTER (WHERE ...)` clauses allows the database to return all counts in one operation.
**Action:** Always prefer consolidated SQL counts for dashboard/stats endpoints and ensure result casting with `::int` to prevent JSON BigInt serialization errors.
