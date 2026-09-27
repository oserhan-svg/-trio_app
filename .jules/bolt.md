## 2024-03-20 - Resolve N+1 query bottleneck in whatsappController
**Learning:** Sequential \`prisma.client.upsert\` queries inside \`for...of\` loops cause massive N+1 database connection bottlenecks in Node.js when repairing large amounts of group chats.
**Action:** Refactored to use chunk-based concurrency (\`Promise.all\` on batches of 20) to safely map arrays to \`upsert\` promises concurrently without exhausting the connection pool.
