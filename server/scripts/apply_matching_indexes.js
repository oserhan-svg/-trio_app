const prisma = require('../db');

async function applyIndexes() {
    console.log('🔧 Applying database indexes for matching optimization...\n');

    try {
        // Execute each CREATE INDEX command
        const indexes = [
            {
                name: 'idx_property_price_type',
                sql: `CREATE INDEX IF NOT EXISTS idx_property_price_type ON properties (listing_type, price) WHERE status != 'removed'`
            },
            {
                name: 'idx_property_neighborhood_lower',
                sql: `CREATE INDEX IF NOT EXISTS idx_property_neighborhood_lower ON properties (LOWER(neighborhood))`
            },
            {
                name: 'idx_property_district_lower',
                sql: `CREATE INDEX IF NOT EXISTS idx_property_district_lower ON properties (LOWER(district))`
            },
            {
                name: 'idx_property_rooms',
                sql: `CREATE INDEX IF NOT EXISTS idx_property_rooms ON properties (rooms) WHERE status != 'removed'`
            },
            {
                name: 'idx_property_status_created',
                sql: `CREATE INDEX IF NOT EXISTS idx_property_status_created ON properties (listing_type, status, created_at DESC)`
            },
            {
                name: 'idx_clientproperty_status_added',
                sql: `CREATE INDEX IF NOT EXISTS idx_clientproperty_status_added ON client_properties (status, added_at DESC)`
            },
            {
                name: 'idx_demand_client',
                sql: `CREATE INDEX IF NOT EXISTS idx_demand_client ON demands (client_id)`
            },
            {
                name: 'idx_agenda_items_start',
                sql: `CREATE INDEX IF NOT EXISTS idx_agenda_items_start ON agenda_items (start_at, user_id)`
            },
            {
                name: 'idx_whatsapp_timestamp',
                sql: `CREATE INDEX IF NOT EXISTS idx_whatsapp_timestamp ON whatsapp_messages (timestamp DESC)`
            },
            {
                name: 'idx_property_status_scraped',
                sql: `CREATE INDEX IF NOT EXISTS idx_property_status_scraped ON properties (status, last_scraped DESC) WHERE status != 'removed'`
            }
        ];

        for (const index of indexes) {
            console.log(`Creating index: ${index.name}...`);
            await prisma.$executeRawUnsafe(index.sql);
            console.log(`✅ ${index.name} created`);
        }

        console.log('\n🔍 Analyzing tables...');
        await prisma.$executeRawUnsafe(`ANALYZE properties`);
        await prisma.$executeRawUnsafe(`ANALYZE client_properties`);
        await prisma.$executeRawUnsafe(` ANALYZE demands`);
        console.log('✅ Analysis complete');

        console.log('\n✅ All indexes applied successfully!\n');

    } catch (error) {
        console.error('❌ Error applying indexes:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

applyIndexes();
