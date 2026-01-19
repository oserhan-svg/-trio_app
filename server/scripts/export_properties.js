const prisma = require('../db');
const fs = require('fs');
const path = require('path');

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
