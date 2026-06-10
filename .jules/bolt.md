## 2024-06-10 - Optimize N+1 aggregate queries using groupBy
**Learning:** Using `Promise.all` inside `.map()` over a list of items (e.g. users) with multiple independent database counts inside (`prisma.property.count`) scales poorly and triggers the N+1 problem. The `prisma.*.groupBy` is much more efficient as it retrieves aggregate counts in a single query reducing db roundtrips drastically.
**Action:** Replace sequential `.count` calls inside a loop with a single grouped query (`groupBy`) outside the loop when calculating stats for multiple entities.
