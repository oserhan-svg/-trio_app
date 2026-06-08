## 2025-02-15 - Optimize concurrent database counts with groupBy
**Learning:** Using multiple concurrent `prisma.*.count` queries for overlapping conditions (e.g. counting total items, plus subsets like active buyers/sellers) causes unnecessary database overhead and connections.
**Action:** Use `prisma.*.groupBy` combined with `_count: { _all: true }` to extract counts for multiple subsets in a single query, then aggregate the results in application logic.
