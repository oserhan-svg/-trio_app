const { query } = require('./db');

async function countProperties() {
    try {
        const res = await query('SELECT count(*) as count FROM properties');
        console.log(`Total Properties in DB: ${res.rows[0].count}`);

        // Check for duplicates
        const dup = await query('SELECT external_id, COUNT(*) c FROM properties GROUP BY external_id HAVING c > 1');
        if (dup.rows.length > 0) {
            console.log('Duplicates found:', dup.rows);
        } else {
            console.log('No duplicates found.');
        }
    } catch (error) {
        console.error(error);
    }
}

countProperties();
