
## 2024-07-17 - Optimize Prisma Query Batching
**Learning:** In the Node.js backend, making multiple independent await prisma.*.count() (or similar aggregate) calls sequentially inside arrays maps introduces an N+1 bottleneck.
**Action:** Always batch these independent Prisma queries using Promise.all to run them concurrently.
