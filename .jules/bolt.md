## 2025-02-15 - Promise.all() for independent Prisma and Service Queries in Controllers
**Learning:** Sequential await calls in controllers like analyticsController cause huge bottlenecks (n+1 latency problem) for dashboard loads.
**Action:** Always wrap independent aggregation or count Prisma queries and external async service calls in Promise.all() to maximize concurrency.
