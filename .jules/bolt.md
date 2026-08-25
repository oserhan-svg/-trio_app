## 2024-05-24 - Batching independent Prisma counts
**Learning:** Sequential await calls for independent database queries create a blocking N+1 pattern, unnecessarily increasing total latency.
**Action:** Batch independent count queries concurrently using Promise.all() to prevent sequential blocking.