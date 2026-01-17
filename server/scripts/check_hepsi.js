const { query } = require('./db');

async function check() {
    try {
        const total = await query("SELECT count(*) as total FROM properties WHERE url LIKE '%hepsiemlak%'");
        console.log('Total Hepsi:', total.rows[0].total);

        const c150 = await query("SELECT count(*) as count FROM properties WHERE url LIKE '%hepsiemlak%' AND url LIKE '%150%'");
        console.log('Hepsi 150 Count:', c150.rows[0].count);

        const last5 = await query("SELECT title, url FROM properties WHERE url LIKE '%hepsiemlak%' ORDER BY created_at DESC LIMIT 10");
        console.table(last5.rows);
    } catch (e) {
        console.error(e);
    }
}
check();
