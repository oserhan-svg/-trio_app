const { query } = require('./db');

async function clearProperties() {
    try {
        console.log('Clearing properties and history...');
        await query('DELETE FROM property_history');
        await query('DELETE FROM properties');

        // Reset auto increment counters if possible (sqlite specific)
        await query("DELETE FROM sqlite_sequence WHERE name='properties' OR name='property_history'");

        console.log('Database cleared (Users preserved).');
    } catch (error) {
        console.error('Error clearing DB:', error);
    }
}

clearProperties();
