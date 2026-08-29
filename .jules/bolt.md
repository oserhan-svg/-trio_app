## 2024-05-24 - Prisma N+1 in repair loops
**Learning:** Sequential DB upserts in a for...of loop can cause N+1 bottleneck and severe latency. Prisma's connection pool remains underutilized while blocking on each roundtrip.
**Action:** Replace `for...of` await loops with `Promise.all` wrapped map functions to resolve DB hits concurrently.
