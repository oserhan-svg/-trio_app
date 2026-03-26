## 2025-05-14 - Optimized Analytics Dashboard Performance
**Learning:** Sequential database queries for counts and independent services can cause "waterfall" latency. Consolidating multiple counts into a single raw SQL query using `SUM(CASE WHEN...)` significantly reduces database round-trips and table scans.
**Action:** Always parallelize independent data-fetching tasks using `Promise.all` and look for opportunities to consolidate multiple related counts or aggregations into a single SQL operation.

## 2025-05-14 - Removed Dead Database I/O
**Learning:** Queries fetching large amounts of data (e.g., 1000 messages) without actually using the result consume unnecessary database resources and memory.
**Action:** Audit service methods for unused data-fetching operations and remove or optimize them, especially in performance-critical paths like analytics.
