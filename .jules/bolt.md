## 2024-10-31 - Sequential Count Queries Bottleneck
**Learning:** Found a specific N+1 bottleneck in `performanceController.js` where 5 independent `prisma.*.count()` queries per consultant were sequentially executed in a map loop, causing severe DB latency on dashboard load.
**Action:** Replaced sequential awaits with `Promise.all` batching for independent database aggregates to ensure they run concurrently.
