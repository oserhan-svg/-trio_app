## 2026-10-19 - Parallelize Sequential Counts in Loops
**Learning:** Sequential await calls for independent Prisma count operations inside loops (e.g., in map arrays) introduce N+1 query bottlenecks, multiplying network roundtrip time by the number of sequential counts.
**Action:** Use Promise.all() to parallelize independent prisma.count() queries within the loop, reducing total execution time from sequential waits to a single concurrent batch.
