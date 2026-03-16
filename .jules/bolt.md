## 2025-05-15 - [Backend] Sequential Query Anti-pattern
**Learning:** Sequential `prisma.count()` calls for independent metrics were causing a linear increase in response time (N queries * Latency).
**Action:** Use `Promise.all` for all independent counts and analytics maps to achieve parallel execution, reducing response time to the maximum of a single query's latency rather than their sum.

## 2025-05-15 - [Frontend] Redundant Aggregate Fetching
**Learning:** The Dashboard was fetching global market analytics at the page level while individual widgets (Heatmap, SupplyDemand) were also fetching their own data or the same aggregate data.
**Action:** Remove page-level aggregate fetches if the data isn't used for shared state or layout, letting widgets manage their own data lifecycle or using a shared cache/context if needed.
