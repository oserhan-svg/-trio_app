## 2024-06-20 - Fix Prisma N+1 in Performance Data
**Learning:** Inside endpoints like `getConsultantPerformance`, executing multiple `.count` calls for each record in a mapping array causes a severe N+1 query explosion over the database (N items * 5 queries). Prisma does not automatically batch `.count` like it dataloader `.findUnique`.
**Action:** Instead of querying per-record in a loop, extract the IDs, run bulk `prisma.*.groupBy` or `.findMany` queries for all target IDs simultaneously via `Promise.all`, and then map the aggregated results back locally.
