## 2024-04-12 - Parallelize Consultant Detail Database Queries
**Learning:** `getConsultantDetail` and `getConsultantPerformance` in `performanceController.js` currently fetch counts and relations sequentially, which increases response time.
**Action:** Use `Promise.all` for independent Prisma queries within backend controllers to parallelize database access and improve response performance.
