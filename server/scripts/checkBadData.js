const { query } = require('./db');

async function check() {
    try {
        console.log('--- Checking potentially misaligned rows ---');
        // Check rows where rooms column looks like a price (contains 'TL' or large numbers)
        const res = await query("SELECT id, title, price, rooms, size_m2, district FROM properties WHERE rooms LIKE '%TL%' OR rooms LIKE '%.000%' LIMIT 10");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
}
check();
