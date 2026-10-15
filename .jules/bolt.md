## 2024-05-18 - Resolve N+1 query bottleneck in whatsappController
**Learning:** Sequential Prisma upsert or update operations inside for...of loops cause severe performance issues due to N+1 query problems.
**Action:** Always batch these operations into an array of Prisma promises and execute them in chunks using `await prisma.$transaction(operationsChunk)` to improve performance.
