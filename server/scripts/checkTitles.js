const { query } = require('./db');

async function checkTitles() {
    try {
        console.log('Checking recent property titles...');
        const res = await query('SELECT external_id, title, price, url FROM properties ORDER BY created_at DESC LIMIT 10');
        console.table(res.rows);
    } catch (error) {
        console.error(error);
    }
}

checkTitles();
