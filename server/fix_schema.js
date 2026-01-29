
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Adding deleted_at column to properties table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);`);
        console.log('Success properties deleted_at.');

        console.log('Adding deleted_at column to clients table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);`);
        console.log('Success clients deleted_at.');

        console.log('Adding embedding column to properties table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "embedding" JSONB;`);

        console.log('Adding is_primary column to properties table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "is_primary" BOOLEAN DEFAULT true;`);

        console.log('Adding group_id column to properties table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "group_id" TEXT;`);

        console.log('Adding auth fields to properties table...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "auth_doc_url" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "auth_start_date" TIMESTAMP(3);`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "auth_end_date" TIMESTAMP(3);`);

    } catch (e) {
        console.error('Error executing raw SQL:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
