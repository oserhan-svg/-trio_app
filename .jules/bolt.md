## 2024-05-25 - Parallelize Database Counts
**Learning:** Sequential, independent database aggregates (`prisma.property.count`) in dashboard endpoints (like `adminController.js` and `analyticsController.js`) create unnecessary latency bottlenecks that easily stack up when fetching metrics.
**Action:** Always group completely independent database queries or async service calls that don't depend on each other's results using `Promise.all()` to execute them concurrently for maximum throughput.
