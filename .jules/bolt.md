## 2024-07-25 - Promise.all Batching for N+1 Analytics Queries
**Learning:** Sequential `prisma.count()` queries in backend controllers (`adminController.js`, `analyticsController.js`) create unnecessary roundtrips to the DB, causing an N+1 bottleneck when computing dashboard stats.
**Action:** Replace independent sequential `await prisma.*.count()` calls with `Promise.all([ ... ])` to run them concurrently in the Node.js backend.
