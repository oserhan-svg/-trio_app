const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use LOCAL_DATABASE_URL if available, otherwise default
const url = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
    datasources: {
        db: { url: url },
    },
});

async function exportProperties() {
    console.log('📦 Exporting properties from local database...');
    try {
        const properties = await prisma.property.findMany();
        const dataPath = path.join(__dirname, '../temp_properties.json');
        fs.writeFileSync(dataPath, JSON.stringify(properties, null, 2));
        console.log(`✅ ${properties.length} properties exported to ${dataPath}`);
    } catch (error) {
        console.error('❌ Export failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportProperties();
