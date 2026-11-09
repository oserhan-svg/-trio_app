## 2024-03-01 - [Bulk Insert Optimization]
**Learning:** Found an N+1 query issue in bulkApprove logic inside pendingContactController.js where findFirst and create were inside a loop, causing excessive queries during bulk operations.
**Action:** Replaced the loop with findMany and createMany using in-memory filtering, optimizing performance.
