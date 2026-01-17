const { query } = require('./db');

async function migrate() {
    try {
        console.log('Adding listing_date column to properties table...');
        await query('ALTER TABLE properties ADD COLUMN listing_date TEXT');
        console.log('Migration successful.');
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('Column already exists.');
        } else {
            console.error('Migration failed:', error);
        }
    }
}

migrate();
