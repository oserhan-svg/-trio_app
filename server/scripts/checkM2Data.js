
const { query } = require('./db');

async function checkM2() {
    try {
        console.log('--- Checking m2 values for Sahibinden ---');
        const res = await query("SELECT id, title, size_m2, rooms, url FROM properties WHERE url LIKE '%sahibinden%' AND (size_m2 = 0 OR size_m2 IS NULL)");
        console.table(res.rows);
        console.log(`Sahibinden listings with 0 or NULL m2: ${res.rows.length} `);

    } catch (e) {
        console.error(e);
    }
}
checkM2();
