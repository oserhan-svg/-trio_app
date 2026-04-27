1. **Optimize `getConsultantPerformance` and `getConsultantDetail` in `server/controllers/performanceController.js`**
   - Refactor `getConsultantPerformance` to wrap the 5 sequential `prisma.*.count` calls inside the `consultants.map` loop with `Promise.all()`.
   - Refactor `getConsultantDetail` to wrap the 2 sequential `prisma.*.count` calls inside the `months.map` loop with `Promise.all()`.
   - In `getConsultantDetail`, also fetch `clientStatusDist` and `recentInteractions` concurrently with the `monthlyStats` computation using a top-level `Promise.all()`.
2. **Verify changes**
   - Run `node --check server/controllers/performanceController.js` to ensure syntax is valid.
   - I will also delete `benchmark_performance.js` and `benchmark_performance_optimized.js` files.
3. **Complete pre commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
4. **Code Review**
   - Run `request_code_review`.
5. **Submit**
   - Submit the PR with the title '⚡ Bolt: Optimize performance API endpoints with Promise.all concurrency' and proper description.
