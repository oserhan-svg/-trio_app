## 2024-07-02 - Optimize sequential Prisma queries
**Learning:** In the Node.js backend, making multiple `await prisma.model.count()` calls sequentially introduces an N+1 bottleneck, even when checking different where conditions.
**Action:** Always batch independent Prisma aggregate or count queries using `Promise.all` to run them concurrently.