## 2024-05-06 - Concurrent Promise Execution in Express Controllers
**Learning:** Sequential Prisma queries inside nested `map` loops can cause severe bottlenecks due to N+1 query patterns. Wait times accumulate linearly per iteration.
**Action:** Always aggregate independent queries into a `Promise.all` array to execute them concurrently instead of using sequential `await` statements.
