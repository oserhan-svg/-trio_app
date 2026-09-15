## 2024-09-15 - Concurrent Loop Processing
**Learning:** Sequential `for...of` loops performing database writes (upserts, updates) cause significant N+1 execution delays and tie up execution threads unnecessarily.
**Action:** Used chunked `Promise.all` batches (size 50) to parallelize Prisma queries without exhausting connection pools.