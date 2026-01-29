const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking current columns...');
        const columns = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'clients'
        `);

        const columnNames = columns.map(c => c.column_name);
        console.log('Existing columns:', columnNames.join(', '));

        const missingColumns = [
            { name: 'ai_delegated', type: 'BOOLEAN DEFAULT false' },
            { name: 'ai_summary', type: 'JSONB' },
            { name: 'last_ai_interaction', type: 'TIMESTAMP WITH TIME ZONE' },
            { name: 'priority_score', type: 'INTEGER DEFAULT 0' },
            { name: 'last_intent_tag', type: 'TEXT' },
            { name: 'last_sentiment', type: 'TEXT' },
            { name: 'sentiment_history', type: 'JSONB' },
            { name: 'next_best_action', type: 'TEXT' },
            { name: 'is_stale', type: 'BOOLEAN DEFAULT false' },
            { name: 'deleted_at', type: 'TIMESTAMP WITH TIME ZONE' }
        ];

        for (const col of missingColumns) {
            if (!columnNames.includes(col.name)) {
                console.log(`Adding column: ${col.name} (${col.type})`);
                await prisma.$executeRawUnsafe(`ALTER TABLE clients ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
