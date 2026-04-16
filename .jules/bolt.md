## 2024-04-16 - [Promise Coalescing for Cache Stampede Prevention]
**Learning:** In high-concurrency environments, caching alone isn't enough to protect the database from expensive queries if multiple requests hit an expired cache at the same time. Promise Coalescing (Request Collapsing) ensures that redundant operations are shared among concurrent callers.
**Action:** Use a `pendingTasks` Map to store in-flight Promises for expensive service methods, ensuring only one operation is active for a given key.

## 2024-04-16 - [Prisma Model Naming Mismatch]
**Learning:** Found that `calculatePipelineVelocity` was failing because it referenced `prisma.clientInteraction` which doesn't exist in `schema.prisma` (the correct model is `interaction`).
**Action:** Always verify Prisma model names against `schema.prisma` when debugging database-related service methods.
