## 2025-05-14 - Parallelized Analytics and Consolidated SQL
**Learning:** Sequential database queries in analytics endpoints caused significant latency. Consolidating multiple counts into a single raw SQL query with conditional aggregation (`COUNT(CASE WHEN...)`) and parallelizing service calls with `Promise.all` dramatically improves response times.
**Action:** Always favor `Promise.all` for independent backend tasks and use consolidated raw SQL queries for multi-property aggregations instead of multiple Prisma `count` calls.
