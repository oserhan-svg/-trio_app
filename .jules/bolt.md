## 2024-05-31 - Concurrent Prisma Queries in Admin Stats
**Learning:** Independent database count queries in backend controllers were executed sequentially, causing a latency bottleneck.
**Action:** Always group independent Prisma queries using `Promise.all` to execute them concurrently and improve API response times.
