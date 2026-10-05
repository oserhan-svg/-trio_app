## 2026-10-05 - Sequential await inside loop causing N+1 bottleneck
**Learning:** In bulk operations (like migrating or updating data in a loop), sequential `await` statements for independent queries (e.g., `update`) create N+1 bottlenecks.
**Action:** Always refactor sequential queries in loops into an array of Prisma promises, and execute them in chunks (e.g., using `await prisma.$transaction(operations.slice(i, i + 50))`) to minimize network roundtrips without exceeding connection limits.
