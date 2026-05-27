## 2024-05-24 - Batching Sequential Database Queries

**Learning:** Sequential Prisma `.count()` calls for compiling metrics or statistics block each other unnecessarily, increasing database response latency.

**Action:** Group independent, non-dependent queries into arrays and await them concurrently using `Promise.all()` to dramatically reduce endpoint response times.
