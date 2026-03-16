## 2024-03-16 - WhatsApp Message Sync Optimization
**Learning:** Syncing WhatsApp chat history involves inserting many new messages at once. Running `prisma.create()` in a loop creates a severe N+1 database bottleneck.
**Action:** Always accumulate records in memory and use `prisma.createMany({ skipDuplicates: true })` for bulk insertions when processing arrays of external data.
