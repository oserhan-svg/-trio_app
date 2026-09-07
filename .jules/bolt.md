## 2024-05-24 - N+1 in syncExtension / syncAllData
**Learning:** Sequential Prisma calls within large arrays of WhatsApp messages/chats exhaust connection pools and drastically slow down the syncing processes.
**Action:** Use chunk-based concurrency instead of sequential `upsert`/`update`/`create` operations.
